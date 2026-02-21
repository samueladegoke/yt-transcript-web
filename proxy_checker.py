import concurrent.futures
import requests
import json
import time
import maxminddb
import os
import sys

# Add backend to path to import ip_providers
sys.path.append(os.path.join(os.getcwd(), "backend"))
from ip_providers import IPValidator

# --- CONFIGURATION ---
CONCURRENCY = 50  # Increased for large 100-proxy batch
TIMEOUT = 12      # Seconds to wait for each proxy
DB_PATH = os.path.join(os.getcwd(), "dbip-city-lite.mmdb")

# List of proxies (Batch 155)
PROXIES = [
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-A4gc37WB_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-JTz3QlD2_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-bZEqCfem_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-X3MrliMU_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-xnaAY7Ei_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-xMXQHwKN_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-XmABRAd9_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-yACU4KHs_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-i09hBKyK_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-zthJlVYb_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-NQG1UY5n_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-KbnqdnnU_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-sQu5PZZr_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-IMKIWk9V_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-CBrZGBsO_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-KBWNYwWd_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-EpvAJJRd_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-tcNL58Mm_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-IsTFWuIv_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-1GWZ7SOd_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-YXP9kyiw_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-ujwJjVla_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-sTwoqX2z_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-cAHloDYY_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-HrS3cLBU_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-nx7onwZQ_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-6huljvrG_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-B7JeB1YX_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-lcGLA2Wb_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-xwkpKG5h_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-OvdzEZuJ_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-anj1jHVu_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-ds0esiHa_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-dap2fXz9_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-4qnVW79o_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-O0IBHkOF_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-QsBr6NUe_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-2PN9UxZf_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-K0CMsUrw_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-v6rvrmgn_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-O8c2Zx9F_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-3mt284Md_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-UWpeZrvl_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-H0sjXnuh_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-f5cypTMO_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-LJaxUnEc_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-ZTuLaCer_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-c4H0uUy4_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-xX02Um0E_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-bi2pdWIG_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-2r2JqncL_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-zJNbWs8g_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-IfWMVjDs_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-mP9NYxP1_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-QdotKeDa_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-nI2nRmZN_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-a4ZUuclQ_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-XJmaxiNJ_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-VRzWcyP1_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-GY2iCYUF_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-0686C1Ab_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-zScCddEE_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-qMV6TkOe_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-R2pScqO0_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-mNLovMkb_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-wArBD4n5_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-KCVz2pfZ_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-Rtadav6O_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-vyinFc9C_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-yopIwxcX_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-31FwpjPB_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-ZvNE3dVN_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-3bTinnMB_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-q27XqYf6_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-XQR8p5AO_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-rmptqobj_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-TNYisI46_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-QMs5JWnv_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-jVglEDYR_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-dml4eNZm_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-vt3TI8zL_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-1HwLgRZZ_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-sXu0P63y_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-sc9qnt4W_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-yQ8bz70z_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-pfMRZD3u_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-fcNfU4Ff_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-Ulwfov0t_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-tSkSWIEF_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-OEKo1QTU_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-rHTMqS6J_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-Mhst7Kjf_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-S6UUGPNY_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-dGxMM2UB_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-EZrdNGqf_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-DEHa7B71_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-WAzkrXW0_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-doogHWMx_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-BRPyJdDi_lifetime-24h_streaming-1",
    "geo.iproyal.com:11200:VYwBbML7ehffgOnT:pnP2ZMQCffoYB2oc_country-ng_city-abuja_session-rj6NmrGd_lifetime-24h_streaming-1",
]

def check_proxy(proxy_str, validator):
    """
    Industry Standard Checker:
    1. Local MMDB (DB-IP) for high-precision Geolocation (Abuja vs Lagos).
    2. Multi-Provider IP Validator (ip-api, ipapi.co, ipinfo.io).
    """
    if not proxy_str.strip(): return None
    
    parts = proxy_str.split(':')
    if len(parts) < 4: return {"status": "error", "error": "Invalid format"}
    
    host, port, user, password = parts[0], parts[1], parts[2], parts[3]
    proxy_url = f"http://{user}:{password}@{host}:{port}"
    proxy_urls = {"http": proxy_url, "https": proxy_url}
    
    # Extract session ID from password (format: ..._session-ID_...)
    session_id = password.split('_session-')[1].split('_')[0] if '_session-' in password else "N/A"
    
    try:
        session = requests.Session()
        data = validator.validate(proxy_urls, session, timeout=TIMEOUT)
        session.close()
        
        if data.get('status') == 'fail':
            data['session'] = session_id
            return data
            
        data['session'] = session_id
        
        # 2. Local High-Precision Geolocation (MaxMind/DB-IP logic)
        if data.get('status') == 'success' and os.path.exists(DB_PATH):
            try:
                with maxminddb.open_database(DB_PATH) as reader:
                    local_geo = reader.get(data['query'])
                    if local_geo:
                        # Override City/Region with high-precision local data
                        data['local_city'] = local_geo.get('city', {}).get('names', {}).get('en', data.get('city'))
                        data['local_region'] = local_geo.get('subdivisions', [{}])[0].get('names', {}).get('en', data.get('region'))
            except Exception as geo_err:
                data['local_geo_error'] = str(geo_err)
        
        return data
    except Exception as e:
        return {"status": "fail", "session": session_id, "error": f"Error: {str(e)[:80]}", "error_type": "unknown"}

def main():
    print(f"[*] Starting Industry-Standard Checker (MULTI-PROVIDER READY)...")
    print(f"[*] Concurrency: {CONCURRENCY} threads | Timeout: {TIMEOUT}s")
    
    if not os.path.exists(DB_PATH):
        print(f"[!] Warning: Local DB not found at {DB_PATH}. Falling back to API only.")

    validator = IPValidator()
    start_time = time.time()
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        # Pass validator instance to each thread
        future_to_proxy = {executor.submit(check_proxy, p, validator): p for p in PROXIES}
        for future in concurrent.futures.as_completed(future_to_proxy):
            res = future.result()
            if res: results.append(res)
    
    total_time = time.time() - start_time
    print(f"[*] Batch complete in {total_time:.2f}s\n")

    matches = []
    print(f"{'SESSION':<12} | {'IP':<15} | {'GEO (MMDB)':<20} | {'ISP':<25} | {'MOB':<5} | {'H':<5} | {'P':<5} | {'RISK'}")
    print("-" * 120)

    for res in results:
        if res.get('status') == 'success':
            # Risk Analysis
            is_hosting = res.get('hosting', False)
            is_proxy = res.get('proxy', False)
            risk = "CLEAN" if not (is_hosting or is_proxy) else "RISK"
            
            # Use Local City if available, otherwise fallback
            city = res.get('local_city', res.get('city'))
            is_mobile = res.get('mobile', False)
            carrier_list = ['AIRTEL', 'MTN', 'SPECTRANET', 'GLOBACOM', '9MOBILE']
            isp_upper = res.get('isp', '').upper()
            is_target_carrier = any(c in isp_upper for c in carrier_list)
            
            # User Request: Stop showing Airtel Rwanda Ltd
            if "AIRTEL RWANDA" in isp_upper:
                is_target_carrier = False
            
            # Special case: SP 217 only accepted from verified FCT areas
            verified_sp217_fct = ['Bwari', 'Abaji', 'Gwagwalada', 'Kuje', 'Kwali']
            is_sp217_verified = 'SP 217' in isp_upper and city in verified_sp217_fct
            is_valid_carrier = is_target_carrier or is_sp217_verified

            indicator = "  "
            # FCT (Abuja) includes these local government areas
            fct_cities = ['Bwari', 'Abaji', 'Gwagwalada', 'Kuje', 'Kwali']
            city_in_fct = city and (city.startswith('Abuja') or city in fct_cities)
            if city_in_fct and is_mobile and is_valid_carrier and risk == "CLEAN":
                indicator = "* "
                matches.append(res)
            
            geo_str = f"{city}"
            print(f"{indicator}{res['session']:<10} | {res['query']:<15} | {geo_str:<20} | {res.get('isp', 'N/A')[:25]:<25} | {str(is_mobile):<5} | {str(is_hosting):<5} | {str(is_proxy):<5} | {risk}")
        else:
            print(f"{'  '}{res.get('session', 'N/A'):<10} | {'FAILED':<15} | ERROR: {res.get('error')}")

    if matches:
        print("\n" + "="*50)
        print("[*] TARGET PROFILES IDENTIFIED (ABUJA + MOBILE + CLEAN)")
        print("="*50)
        for m in matches:
            print(f"Session: {m['session']} | IP: {m['query']} | Carrier: {m['isp']} | City: {m.get('local_city', m.get('city'))}")
    else:
        print("\n[!] No Profiles matched the clean-cellular Abuja requirement in this batch.")

if __name__ == "__main__":
    main()
