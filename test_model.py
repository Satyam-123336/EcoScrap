import requests
import base64
import json

def test_health():
    try:
        response = requests.get('http://localhost:5001/health')
        print(f"Health check status: {response.status_code}")
        print(f"Health check response: {response.json()}")
        return True
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_prediction():
    try:
        
        with open('dataset/Mobile/Mobile_0.jpg', 'rb') as f:
            image_data = f.read()

        
        base64_image = base64.b64encode(image_data).decode('utf-8')

        
        response = requests.post(
            'http://localhost:5001/predict',
            json={'image': base64_image},
            headers={'Content-Type': 'application/json'}
        )

        print(f"Prediction status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"Prediction result: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"Prediction failed: {response.text}")
            return False

    except Exception as e:
        print(f"Prediction test failed: {e}")
        return False

if __name__ == '__main__':
    print("Testing Python model server...")
    health_ok = test_health()
    if health_ok:
        prediction_ok = test_prediction()
        if prediction_ok:
            print(" All tests passed!")
        else:
            print(" Prediction test failed")
    else:
        print(" Health check failed")

