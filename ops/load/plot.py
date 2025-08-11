#!/usr/bin/env python3
"""
Plot generator for k6 load test results (offline mode)
Usage: python3 ops/load/plot.py ops/load/out/baseline.json
"""

import json
import sys
import os
from datetime import datetime
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np

def load_k6_results(json_file):
    """Load and parse k6 JSON results"""
    with open(json_file, 'r') as f:
        data = []
        for line in f:
            try:
                data.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return data

def extract_metrics(data):
    """Extract relevant metrics from k6 data"""
    timestamps = []
    http_reqs = []
    http_req_durations = []
    http_req_failed = []
    vus = []
    
    for entry in data:
        if entry.get('type') == 'Point':
            metric = entry.get('metric')
            timestamp = datetime.fromisoformat(entry.get('time').replace('Z', '+00:00'))
            value = entry.get('data', {}).get('value', 0)
            
            timestamps.append(timestamp)
            
            if metric == 'http_reqs':
                http_reqs.append(value)
            elif metric == 'http_req_duration':
                http_req_durations.append(value)
            elif metric == 'http_req_failed':
                http_req_failed.append(value)
            elif metric == 'vus':
                vus.append(value)
            else:
                # Fill with previous value or 0
                http_reqs.append(http_reqs[-1] if http_reqs else 0)
                http_req_durations.append(http_req_durations[-1] if http_req_durations else 0)
                http_req_failed.append(http_req_failed[-1] if http_req_failed else 0)
                vus.append(vus[-1] if vus else 0)
    
    return {
        'timestamps': timestamps,
        'http_reqs': http_reqs,
        'http_req_durations': http_req_durations,
        'http_req_failed': http_req_failed,
        'vus': vus
    }

def calculate_rps(timestamps, http_reqs, window_size=10):
    """Calculate requests per second with moving average"""
    if len(http_reqs) < 2:
        return [0] * len(timestamps)
    
    rps = []
    for i in range(len(http_reqs)):
        if i == 0:
            rps.append(0)
        else:
            time_diff = (timestamps[i] - timestamps[i-1]).total_seconds()
            if time_diff > 0:
                req_diff = max(0, http_reqs[i] - http_reqs[i-1])
                rps.append(req_diff / time_diff)
            else:
                rps.append(0)
    
    # Apply moving average
    if window_size > 1:
        smoothed_rps = []
        for i in range(len(rps)):
            start_idx = max(0, i - window_size // 2)
            end_idx = min(len(rps), i + window_size // 2 + 1)
            smoothed_rps.append(np.mean(rps[start_idx:end_idx]))
        return smoothed_rps
    
    return rps

def calculate_error_rate(http_req_failed, http_reqs):
    """Calculate error rate percentage"""
    error_rates = []
    for i in range(len(http_reqs)):
        if http_reqs[i] > 0:
            error_rate = (http_req_failed[i] / http_reqs[i]) * 100
            error_rates.append(error_rate)
        else:
            error_rates.append(0)
    return error_rates

def create_plots(metrics, output_dir, test_name):
    """Create and save plots"""
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle(f'k6 Load Test Results - {test_name}', fontsize=16)
    
    timestamps = metrics['timestamps']
    
    # Plot 1: RPS
    rps = calculate_rps(timestamps, metrics['http_reqs'])
    ax1.plot(timestamps, rps, 'b-', alpha=0.7, linewidth=1)
    ax1.set_title('Requests Per Second (RPS)')
    ax1.set_ylabel('RPS')
    ax1.grid(True, alpha=0.3)
    ax1.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
    
    # Plot 2: Latency (P95/P99 approximation)
    durations_ms = [d for d in metrics['http_req_durations']]
    ax2.plot(timestamps, durations_ms, 'g-', alpha=0.7, linewidth=1, label='Response Time')
    
    # Calculate percentiles (rough approximation)
    if len(durations_ms) > 10:
        p95_approx = np.percentile(durations_ms, 95)
        p99_approx = np.percentile(durations_ms, 99)
        ax2.axhline(y=p95_approx, color='orange', linestyle='--', alpha=0.7, label=f'P95 ≈ {p95_approx:.0f}ms')
        ax2.axhline(y=p99_approx, color='red', linestyle='--', alpha=0.7, label=f'P99 ≈ {p99_approx:.0f}ms')
    
    ax2.set_title('Response Time (ms)')
    ax2.set_ylabel('Milliseconds')
    ax2.grid(True, alpha=0.3)
    ax2.legend()
    ax2.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
    
    # Plot 3: Error Rate
    error_rates = calculate_error_rate(metrics['http_req_failed'], metrics['http_reqs'])
    ax3.plot(timestamps, error_rates, 'r-', alpha=0.7, linewidth=1)
    ax3.set_title('Error Rate (%)')
    ax3.set_ylabel('Error %')
    ax3.grid(True, alpha=0.3)
    ax3.set_ylim(bottom=0)
    ax3.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
    
    # Plot 4: Virtual Users
    ax4.plot(timestamps, metrics['vus'], 'purple', alpha=0.7, linewidth=2)
    ax4.set_title('Virtual Users (VUs)')
    ax4.set_ylabel('VUs')
    ax4.grid(True, alpha=0.3)
    ax4.fill_between(timestamps, metrics['vus'], alpha=0.2, color='purple')
    ax4.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
    
    # Format x-axis for all subplots
    for ax in [ax1, ax2, ax3, ax4]:
        ax.tick_params(axis='x', rotation=45)
        ax.set_xlabel('Time')
    
    plt.tight_layout()
    
    # Save plot
    output_file = os.path.join(output_dir, f'{test_name}_results.png')
    plt.savefig(output_file, dpi=150, bbox_inches='tight')
    print(f"📊 Plot saved: {output_file}")
    
    # Save summary stats
    stats_file = os.path.join(output_dir, f'{test_name}_summary.txt')
    with open(stats_file, 'w') as f:
        f.write(f"k6 Load Test Summary - {test_name}\n")
        f.write("=" * 50 + "\n\n")
        
        if durations_ms:
            f.write(f"Response Time Stats:\n")
            f.write(f"  Average: {np.mean(durations_ms):.2f} ms\n")
            f.write(f"  P50: {np.percentile(durations_ms, 50):.2f} ms\n")
            f.write(f"  P95: {np.percentile(durations_ms, 95):.2f} ms\n")
            f.write(f"  P99: {np.percentile(durations_ms, 99):.2f} ms\n")
            f.write(f"  Max: {max(durations_ms):.2f} ms\n\n")
        
        if rps:
            f.write(f"Throughput Stats:\n")
            f.write(f"  Average RPS: {np.mean(rps):.2f}\n")
            f.write(f"  Max RPS: {max(rps):.2f}\n\n")
        
        if error_rates:
            avg_error_rate = np.mean(error_rates)
            f.write(f"Error Stats:\n")
            f.write(f"  Average Error Rate: {avg_error_rate:.2f}%\n")
            f.write(f"  Max Error Rate: {max(error_rates):.2f}%\n\n")
        
        if metrics['vus']:
            f.write(f"Load Stats:\n")
            f.write(f"  Max VUs: {max(metrics['vus'])}\n")
            f.write(f"  Average VUs: {np.mean(metrics['vus']):.1f}\n")
    
    print(f"📄 Summary saved: {stats_file}")

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 ops/load/plot.py <k6_json_file>")
        print("Example: python3 ops/load/plot.py ops/load/out/baseline.json")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    if not os.path.exists(json_file):
        print(f"Error: File {json_file} not found")
        sys.exit(1)
    
    print(f"📈 Processing k6 results: {json_file}")
    
    # Extract test name from filename
    test_name = os.path.splitext(os.path.basename(json_file))[0]
    output_dir = os.path.dirname(json_file)
    
    # Load and process data
    try:
        data = load_k6_results(json_file)
        print(f"📊 Loaded {len(data)} data points")
        
        metrics = extract_metrics(data)
        print(f"📊 Extracted metrics for {len(metrics['timestamps'])} timestamps")
        
        # Create plots
        create_plots(metrics, output_dir, test_name)
        
        print("✅ Plot generation completed!")
        
    except Exception as e:
        print(f"❌ Error processing data: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()