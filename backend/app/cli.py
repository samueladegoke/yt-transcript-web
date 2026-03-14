#!/usr/bin/env python3
"""
YouTube Transcript CLI
Command-line interface for fetching and analyzing YouTube transcripts.
"""
import argparse
import asyncio
import json
import sys
from typing import Optional, List

from backend.app.transcript_service import (
    TranscriptService,
    TranscriptSegment,
    VideoInfo,
    check_environment,
    InvalidUrlError,
    TranscriptNotFoundError,
)


def format_transcript_text(segments: List[TranscriptSegment]) -> str:
    """Format transcript as plain text."""
    return "\n".join([seg.text for seg in segments])


def format_transcript_json(segments: List[TranscriptSegment]) -> str:
    """Format transcript as JSON."""
    data = [
        {"start": seg.start, "duration": seg.duration, "text": seg.text}
        for seg in segments
    ]
    return json.dumps(data, indent=2)


def format_transcript_srt(segments: List[TranscriptSegment]) -> str:
    """Format transcript as SRT (SubRip) subtitles."""
    lines = []
    for i, seg in enumerate(segments, 1):
        start = format_srt_time(seg.start)
        end = format_srt_time(seg.start + seg.duration)
        lines.append(f"{i}\n{start} --> {end}\n{seg.text}\n")
    return "\n".join(lines)


def format_srt_time(seconds: float) -> str:
    """Convert seconds to SRT time format (HH:MM:SS,ms)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def format_video_info_text(info: VideoInfo) -> str:
    """Format video info as plain text."""
    return (
        f"Title: {info.title}\n"
        f"Channel: {info.channel}\n"
        f"Duration: {info.duration}\n"
        f"Views: {info.view_count}\n"
        f"Upload Date: {info.upload_date}\n"
        f"Video ID: {info.video_id}"
    )


def format_video_info_json(info: VideoInfo) -> str:
    """Format video info as JSON."""
    data = {
        "video_id": info.video_id,
        "title": info.title,
        "channel": info.channel,
        "duration": info.duration,
        "view_count": info.view_count,
        "upload_date": info.upload_date,
    }
    return json.dumps(data, indent=2)


async def cmd_transcript(url: str, output: Optional[str], format_type: str, lang: str) -> int:
    """Execute transcript command."""
    try:
        async with TranscriptService() as service:
            segments = await service.get_transcript(url, lang)
            
            # Format output
            if format_type == "json":
                result = format_transcript_json(segments)
            elif format_type == "srt":
                result = format_transcript_srt(segments)
            else:  # text
                result = format_transcript_text(segments)
            
            # Output
            if output:
                with open(output, "w", encoding="utf-8") as f:
                    f.write(result)
                print(f"Transcript saved to: {output}")
            else:
                print(result)
            
            return 0
    except InvalidUrlError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except TranscriptNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


async def cmd_info(url: str, output: Optional[str], format_type: str) -> int:
    """Execute info command."""
    try:
        async with TranscriptService() as service:
            info = await service.get_video_info(url)
            
            # Format output
            if format_type == "json":
                result = format_video_info_json(info)
            else:
                result = format_video_info_text(info)
            
            # Output
            if output:
                with open(output, "w", encoding="utf-8") as f:
                    f.write(result)
                print(f"Video info saved to: {output}")
            else:
                print(result)
            
            return 0
    except InvalidUrlError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


async def cmd_analyze(url: str, analysis_type: str, output: Optional[str], format_type: str, lang: str) -> int:
    """Execute analyze command."""
    try:
        async with TranscriptService() as service:
            result = await service.analyze(url, analysis_type, lang)
            
            # Format output
            if format_type == "json":
                output_text = json.dumps(result, indent=2)
            else:
                # For text format, extract the main content
                if "summary" in result:
                    output_text = result["summary"]
                elif "outline" in result:
                    output_text = "\n".join([f"- {item}" for item in result["outline"]])
                elif "key_points" in result:
                    output_text = "\n".join([f"• {item}" for item in result["key_points"]])
                else:
                    output_text = json.dumps(result, indent=2)
            
            # Output
            if output:
                with open(output, "w", encoding="utf-8") as f:
                    f.write(output_text)
                print(f"Analysis saved to: {output}")
            else:
                print(output_text)
            
            return 0
    except InvalidUrlError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except TranscriptNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return 1


async def cmd_health() -> int:
    """Execute health check command."""
    try:
        result = await check_environment()
        print(json.dumps(result, indent=2))
        
        if result.get("status") == "healthy":
            return 0
        else:
            return 1
    except Exception as e:
        print(f"Health check failed: {e}", file=sys.stderr)
        return 1


def main():
    """Main entry point for the CLI."""
    parser = argparse.ArgumentParser(
        prog="yt-transcript",
        description="YouTube Transcript CLI - Fetch and analyze YouTube video transcripts"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # Transcript command
    transcript_parser = subparsers.add_parser("transcript", help="Get video transcript")
    transcript_parser.add_argument("url", help="YouTube video URL or ID")
    transcript_parser.add_argument("-o", "--output", help="Output file path")
    transcript_parser.add_argument("-f", "--format", choices=["text", "json", "srt"], default="text",
                                   help="Output format (default: text)")
    transcript_parser.add_argument("--lang", default="en", help="Language code (default: en)")
    
    # Info command
    info_parser = subparsers.add_parser("info", help="Get video information")
    info_parser.add_argument("url", help="YouTube video URL or ID")
    info_parser.add_argument("-o", "--output", help="Output file path")
    info_parser.add_argument("-f", "--format", choices=["text", "json"], default="text",
                             help="Output format (default: text)")
    
    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze video transcript")
    analyze_parser.add_argument("url", help="YouTube video URL or ID")
    analyze_parser.add_argument("-o", "--output", help="Output file path")
    analyze_parser.add_argument("-f", "--format", choices=["text", "json"], default="text",
                                help="Output format (default: text)")
    analyze_parser.add_argument("--lang", default="en", help="Language code (default: en)")
    analyze_parser.add_argument("--type", choices=["summary", "outline", "key_points"], default="summary",
                                help="Analysis type (default: summary)")
    
    # Health command
    subparsers.add_parser("health", help="Check environment and configuration")
    
    args = parser.parse_args()
    
    # Execute command
    if args.command == "transcript":
        sys.exit(asyncio.run(cmd_transcript(
            args.url, args.output, args.format, args.lang
        )))
    elif args.command == "info":
        sys.exit(asyncio.run(cmd_info(
            args.url, args.output, args.format
        )))
    elif args.command == "analyze":
        sys.exit(asyncio.run(cmd_analyze(
            args.url, args.type, args.output, args.format, args.lang
        )))
    elif args.command == "health":
        sys.exit(asyncio.run(cmd_health()))
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
