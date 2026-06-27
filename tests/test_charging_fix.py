#!/usr/bin/env python3
"""
Quick test for charging accessories type mapping
"""

import requests
import json

def test_charging_accessories():
    print("🔌 Testing Charging Accessories Type Mapping")
    print("=" * 50)
    
    # Test image data
    test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    # Test with charging accessories
    try:
        batch_request = {
            'images': [
                {
                    'data': f'data:image/png;base64,{test_image_base64}',
                    'filename': 'phone_charger.jpg'
                }
            ],
            'selectedTypes': ['charging_accessories']  # This should match now
        }
        
        response = requests.post(
            'http://127.0.0.1:5001/predict',
            json=batch_request,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Test Results:")
            print(f"   Has Mismatches: {result.get('has_mismatches', 'unknown')}")
            
            for item in result.get('batch_results', []):
                classification = item.get('classification', 'unknown')
                mismatch = item.get('mismatch', False)
                status = "❌ MISMATCH" if mismatch else "✅ MATCH"
                print(f"   Classification: {classification} - {status}")
                
            if not result.get('has_mismatches', True):
                print("\n🎉 SUCCESS: Charging accessories type mapping is fixed!")
            else:
                print(f"\n⚠️ Still has mismatches: {result.get('type_mismatches', [])}")
        else:
            print(f"❌ Request failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Test error: {e}")

if __name__ == '__main__':
    test_charging_accessories()