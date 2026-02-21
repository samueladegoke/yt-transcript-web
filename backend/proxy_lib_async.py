"""
Proxy Checker Library - Async Optimized Version
================================================
High-performance async proxy validation with aiohttp.

PERFORMANCE OPTIMIZATIONS:
1. True async with aiohttp (no thread pool overhead)
2. Large connection pool (200 connections)
3. Real-time progress streaming via WebSocket
4. Optimized timeout handling
5. Connection reuse across all requests
"""
import aiohttp
import asyncio
import maxminddb
import os
import time
import logging
from typing import Optional, Dict, Any, Tuple, List, Callable, AsyncGenerator
from enum import Enum
import json

# SOCKS support for aiohttp
try:
    from aiohttp_socks import ProxyConnector
    from aiohttp_socks._errors import ProxyError as SocksProxyError
    SOCKS_SUPPORT = True
except ImportError:
    SOCKS_SUPPORT = False
    SocksProxyError = Exception  # Fallback to base Exception
    logging.warning("aiohttp-socks not installed. SOCKS proxy support limited.")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProxyProtocol(Enum):
    """Supported proxy protocols."""
    HTTP = "http"
    HTTPS = "https"
    SOCKS4 = "socks4"
    SOCKS5 = "socks5"


# Configuration
TIMEOUT = int(os.getenv("PROXY_TIMEOUT", "8"))  # Reduced from 12s
CONNECT_TIMEOUT = int(os.getenv("PROXY_CONNECT_TIMEOUT", "5"))  # Connection timeout
DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "dbip-city-lite.mmdb"
)

# Carrier configuration
CARRIER_LIST = ['AIRTEL', 'MTN', 'SPECTRANET', 'GLOBACOM', '9MOBILE']
EXCLUDED_CARRIERS = ['AIRTEL RWANDA']
VERIFIED_SP217_FCT = ['Bwari', 'Abaji', 'Gwagwalada', 'Kuje', 'Kwali']

# IP validation providers (in order of preference)
# Fields to request from ip-api.com - must include mobile, proxy, hosting for accurate risk detection
IP_API_URL = "http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,isp,org,mobile,proxy,hosting,query"

IP_PROVIDERS = [
    {
        "name": "ip-api.com",
        "url": IP_API_URL,
        "timeout": 8
    }
]


class MaxMindDBManager:
    """Singleton manager for MaxMind database reader."""
    _instance = None
    _lock = asyncio.Lock()
    _reader = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def initialize(self, db_path: str = DB_PATH) -> bool:
        """Initialize the database reader."""
        async with self._lock:
            if self._reader is not None:
                return True
            
            if not os.path.exists(db_path):
                logger.warning(f"MaxMind DB not found at {db_path}")
                return False
            
            try:
                self._reader = maxminddb.open_database(db_path)
                logger.info(f"MaxMind DB initialized: {db_path}")
                return True
            except Exception as e:
                logger.error(f"Failed to open MaxMind DB: {e}")
                return False
    
    def get_location(self, ip: str) -> Optional[Dict[str, Any]]:
        """Get geolocation data for an IP address."""
        if self._reader is None:
            return None
        
        try:
            return self._reader.get(ip)
        except Exception as e:
            logger.error(f"Geo lookup error for {ip}: {e}")
            return None
    
    def close(self):
        """Close the database reader."""
        if self._reader is not None:
            self._reader.close()
            self._reader = None
            logger.info("MaxMind DB closed")


# Global singleton
_db_manager = MaxMindDBManager()


def parse_proxy_string(proxy_str: str) -> Tuple[str, str, str, str, str]:
    """Parse a proxy string into components."""
    if not proxy_str or not proxy_str.strip():
        raise ValueError("Empty proxy string")
    
    proxy_str = proxy_str.strip()
    protocol = "http"
    
    if "://" in proxy_str:
        protocol, proxy_str = proxy_str.split("://", 1)
        protocol = protocol.lower()
    
    parts = proxy_str.split(':')
    
    if len(parts) < 4:
        raise ValueError(f"Invalid proxy format: expected 4+ parts, got {len(parts)}")
    
    host, port, user, password = parts[0], parts[1], parts[2], parts[3]
    
    if len(parts) >= 5 and parts[4].lower() in ["http", "https", "socks4", "socks5"]:
        protocol = parts[4].lower()
    
    valid_protocols = ["http", "https", "socks4", "socks5"]
    if protocol not in valid_protocols:
        raise ValueError(f"Invalid protocol: {protocol}")
    
    try:
        port_num = int(port)
        if not (1 <= port_num <= 65535):
            raise ValueError(f"Port out of range: {port_num}")
    except ValueError:
        raise ValueError(f"Invalid port number: {port}")
    
    return host, port, user, password, protocol


def extract_session_id(password: str) -> str:
    """Extract session ID from password string."""
    if '_session-' in password:
        try:
            return password.split('_session-')[1].split('_')[0]
        except IndexError:
            pass
    return "N/A"


def analyze_risk(data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze proxy data for risk indicators."""
    is_hosting = data.get('hosting', False)
    is_proxy = data.get('proxy', False)
    city = data.get('local_city', data.get('city'))
    
    isp_upper = data.get('isp', '').upper()
    is_target_carrier = any(c in isp_upper for c in CARRIER_LIST)
    
    for excluded in EXCLUDED_CARRIERS:
        if excluded in isp_upper:
            is_target_carrier = False
            break
    
    is_sp217_verified = 'SP 217' in isp_upper and city in VERIFIED_SP217_FCT
    
    return {
        'is_valid_carrier': is_target_carrier or is_sp217_verified,
        'risk_level': "CLEAN" if not (is_hosting or is_proxy) else "RISK"
    }


async def validate_ip_with_provider(
    session: aiohttp.ClientSession,
    proxy_url: str,
    provider: dict,
    timeout: int
) -> Optional[Dict[str, Any]]:
    """Try to validate IP with a specific provider."""
    try:
        timeout_obj = aiohttp.ClientTimeout(total=provider.get("timeout", timeout))
        
        async with session.get(
            IP_API_URL,
            proxy=proxy_url,
            timeout=timeout_obj,
            ssl=False
        ) as response:
            if response.status != 200:
                return None
            
            # Check content type
            content_type = response.headers.get('Content-Type', '')
            if 'application/json' not in content_type:
                return None
            
            text = await response.text()
            if not text or not text.strip():
                return None
            
            data = json.loads(text)
            
            if data.get('status') == 'fail':
                return None
            
            return data
            
    except (asyncio.TimeoutError, aiohttp.ClientError, json.JSONDecodeError):
        return None


async def check_single_proxy_async(
    proxy_str: str,
    session: aiohttp.ClientSession,
    protocol: str = "http",
    timeout: int = None
) -> Dict[str, Any]:
    """
    Check a single proxy asynchronously.
    
    Args:
        proxy_str: Proxy string
        session: Shared aiohttp session (not used for SOCKS, we create our own)
        protocol: Proxy protocol
        timeout: Request timeout
    
    Returns:
        Dict with proxy check results
    """
    timeout = timeout or TIMEOUT
    
    try:
        host, port, user, password, detected_protocol = parse_proxy_string(proxy_str)
        protocol = protocol if protocol != "http" else detected_protocol
    except ValueError as e:
        return {"session": "N/A", "status": "error", "error": str(e)}
    
    session_id = extract_session_id(password)
    
    # For SOCKS proxies, we need to use ProxyConnector
    if protocol in ["socks4", "socks5"] and SOCKS_SUPPORT:
        try:
            # Create connector for SOCKS proxy
            connector = ProxyConnector.from_url(
                f"{protocol}://{user}:{password}@{host}:{port}",
                limit=1
            )
            timeout_obj = aiohttp.ClientTimeout(total=timeout, connect=CONNECT_TIMEOUT)
            
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout_obj
            ) as socks_session:
                async with socks_session.get(
                    IP_API_URL,
                    timeout=timeout_obj,
                    ssl=False
                ) as response:
                    return await _process_response(response, session_id, protocol)
        
        except asyncio.TimeoutError:
            return {
                "session": session_id,
                "status": "fail",
                "error": f"Timeout after {timeout}s",
                "error_type": "timeout"
            }
        except aiohttp.ClientProxyConnectionError as e:
            return {
                "session": session_id,
                "status": "fail",
                "error": f"Proxy connection failed: {str(e)[:80]}",
                "error_type": "proxy_error"
            }
        except aiohttp.ClientConnectorError as e:
            return {
                "session": session_id,
                "status": "fail",
                "error": f"Connection failed: {str(e)[:80]}",
                "error_type": "connection_error"
            }
        
        except SocksProxyError as e:
            return {
                "session": session_id,
                "status": "fail",
                "error": f"SOCKS proxy error: {str(e)[:80]}",
                "error_type": "socks_error"
            }
        
        except aiohttp.ClientError as e:
            return {
                "session": session_id,
                "status": "fail",
                "error": f"Client error: {str(e)[:80]}",
                "error_type": "client_error"
            }
        except Exception as e:
            logger.exception(f"Unexpected error checking SOCKS proxy {session_id}")
            return {
                "session": session_id,
                "status": "fail",
                "error": f"Unexpected error: {str(e)[:80]}",
                "error_type": "unknown"
            }
    
    # HTTP/HTTPS proxy - use the shared session with proxy parameter
    proxy_url = f"http://{user}:{password}@{host}:{port}"
    
    try:
        # Try ip-api.com first (with all required fields)
        timeout_obj = aiohttp.ClientTimeout(total=timeout, connect=CONNECT_TIMEOUT)
        
        async with session.get(
            IP_API_URL,
            proxy=proxy_url,
            timeout=timeout_obj,
            ssl=False
        ) as response:
            return await _process_response(response, session_id, protocol)
    
    except asyncio.TimeoutError:
        return {
            "session": session_id,
            "status": "fail",
            "error": f"Timeout after {timeout}s",
            "error_type": "timeout"
        }
    
    except aiohttp.ClientProxyConnectionError as e:
        return {
            "session": session_id,
            "status": "fail",
            "error": f"Proxy connection failed: {str(e)[:80]}",
            "error_type": "proxy_error"
        }
    
    except aiohttp.ClientConnectorError as e:
        return {
            "session": session_id,
            "status": "fail",
            "error": f"Connection failed: {str(e)[:80]}",
            "error_type": "connection_error"
        }
    
    except aiohttp.ClientError as e:
        return {
            "session": session_id,
            "status": "fail",
            "error": f"Client error: {str(e)[:80]}",
            "error_type": "client_error"
        }
    
    except Exception as e:
        logger.exception(f"Unexpected error checking proxy {session_id}")
        return {
            "session": session_id,
            "status": "fail",
            "error": f"Unexpected error: {str(e)[:80]}",
            "error_type": "unknown"
        }


async def _process_response(
    response: aiohttp.ClientResponse,
    session_id: str,
    protocol: str
) -> Dict[str, Any]:
    """Process API response and return formatted result."""
    # Check HTTP status
    if response.status != 200:
        return {
            "session": session_id,
            "status": "fail",
            "error": f"HTTP {response.status}",
            "error_type": "http_error"
        }
    
    # Check content type
    content_type = response.headers.get('Content-Type', '')
    if 'application/json' not in content_type:
        text = await response.text()
        return {
            "session": session_id,
            "status": "fail",
            "error": "Non-JSON response",
            "error_type": "invalid_response"
        }
    
    # Parse JSON
    text = await response.text()
    if not text or not text.strip():
        return {
            "session": session_id,
            "status": "fail",
            "error": "Empty response",
            "error_type": "empty_response"
        }
    
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return {
            "session": session_id,
            "status": "fail",
            "error": "Invalid JSON",
            "error_type": "json_error"
        }
    
    # Check API status
    if data.get('status') == 'fail':
        return {
            "session": session_id,
            "status": "fail",
            "error": data.get('message', 'API returned failure'),
            "error_type": "api_fail"
        }
    
    # Success - normalize and add metadata
    data['status'] = 'success'  # Normalize ip-api 'ok' status to 'success'
    data['session'] = session_id
    data['protocol'] = protocol
    
    # Ensure boolean fields are actual booleans (ip-api returns them correctly, but coerce just in case)
    data['mobile'] = bool(data.get('mobile', False))
    data['hosting'] = bool(data.get('hosting', False))
    data['proxy'] = bool(data.get('proxy', False))
    
    # Local geo lookup
    if data.get('query'):
        ip = data.get('query')
        local_geo = _db_manager.get_location(ip)
        if local_geo:
            city_names = local_geo.get('city', {}).get('names', {})
            data['local_city'] = city_names.get('en', data.get('city'))
            
            subdivisions = local_geo.get('subdivisions', [{}])
            if subdivisions:
                region_names = subdivisions[0].get('names', {})
                data['local_region'] = region_names.get('en', data.get('regionName', data.get('region')))
    
    # Risk analysis
    risk_data = analyze_risk(data)
    data.update(risk_data)
    
    return data


async def check_proxies_stream(
    proxy_list: List[str],
    protocol: str = "http",
    max_concurrent: int = 100,
    timeout: int = None,
    progress_callback: Callable[[int, int, Dict], None] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Check proxies with streaming results.
    
    Yields results as they complete, enabling real-time progress updates.
    
    Args:
        proxy_list: List of proxy strings
        protocol: Default proxy protocol
        max_concurrent: Maximum concurrent checks (default 100)
        timeout: Request timeout
        progress_callback: Optional callback(completed, total, result)
    
    Yields:
        Dict with proxy check results
    """
    # Initialize MaxMind DB
    await _db_manager.initialize()
    
    total = len(proxy_list)
    completed = 0
    
    # Configure connection pool
    connector = aiohttp.TCPConnector(
        limit=max_concurrent,
        limit_per_host=20,
        ttl_dns_cache=300,
        enable_cleanup_closed=True
    )
    
    timeout_obj = aiohttp.ClientTimeout(total=timeout or TIMEOUT, connect=CONNECT_TIMEOUT)
    
    async with aiohttp.ClientSession(
        connector=connector,
        timeout=timeout_obj,
        trust_env=True
    ) as session:
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def check_with_semaphore(proxy: str) -> Dict[str, Any]:
            nonlocal completed
            async with semaphore:
                result = await check_single_proxy_async(proxy, session, protocol, timeout)
                completed += 1
                if progress_callback:
                    progress_callback(completed, total, result)
                return result
        
        # Create all tasks
        tasks = [check_with_semaphore(proxy) for proxy in proxy_list]
        
        # Yield results as they complete
        for coro in asyncio.as_completed(tasks):
            result = await coro
            yield result


async def check_proxies_batch_async(
    proxy_list: List[str],
    protocol: str = "http",
    max_concurrent: int = 100,
    timeout: int = None
) -> List[Dict[str, Any]]:
    """
    Check all proxies and return results.
    
    For streaming results, use check_proxies_stream instead.
    """
    results = []
    async for result in check_proxies_stream(proxy_list, protocol, max_concurrent, timeout):
        results.append(result)
    return results


def cleanup():
    """Cleanup resources."""
    _db_manager.close()


def get_db_stats():
    """Return database manager status."""
    return {
        "db_path": DB_PATH,
        "reader_active": _db_manager._reader is not None,
        "db_exists": os.path.exists(DB_PATH)
    }


# Synchronous wrapper for backward compatibility
def check_proxies_batch(proxy_list: list, protocol: str = "http", max_workers: int = 50, timeout: int = None) -> list:
    """Synchronous wrapper for backward compatibility."""
    return asyncio.run(check_proxies_batch_async(proxy_list, protocol, max_workers, timeout))


def check_single_proxy(proxy_str: str, protocol: str = "http", timeout: int = None, session=None) -> Dict[str, Any]:
    """Synchronous wrapper for single proxy check."""
    return asyncio.run(check_single_proxy_async_wrapper(proxy_str, protocol, timeout))


async def check_single_proxy_async_wrapper(proxy_str: str, protocol: str = "http", timeout: int = None) -> Dict[str, Any]:
    """Async wrapper for single proxy check."""
    await _db_manager.initialize()
    
    connector = aiohttp.TCPConnector(limit=1)
    timeout_obj = aiohttp.ClientTimeout(total=timeout or TIMEOUT, connect=CONNECT_TIMEOUT)
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout_obj) as session:
        return await check_single_proxy_async(proxy_str, session, protocol, timeout)
