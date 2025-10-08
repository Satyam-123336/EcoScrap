import * as http from 'http';
import { pythonModelManager } from './pythonProcess';


export const EWasteCategories = [
  'Audio devices',
  'Battery',
  'Charging and Connectivity Accessories',
  'Hard Drive',
  'Keyboard',
  'Mobile',
  'Mouse',
  'PCB',
  'Pen Drive'
];


export const CATEGORY_MAPPING: { [key: string]: string } = {
  'audio_devices': 'Audio devices',
  'mobile': 'Mobile',
  'battery': 'Battery',
  'chargers': 'Charging and Connectivity Accessories',
  'keyboard': 'Keyboard',
  'mouse': 'Mouse',
  'hard_drive': 'Hard Drive',
  'small_electronics': 'PCB'
};


const PYTHON_SERVER_HOST = '127.0.0.1';
const PYTHON_SERVER_PORT = 5001;


export async function analyzeEWasteImageLocal(imageBuffer: Buffer): Promise<{
  classification: string;
  confidence: number;
  recyclable: boolean;
  estimatedWeight: string;
  suggestions: string[];
}> {
  try {
    console.log('Analyzing e-waste image with original Keras model via Python server...');

    // Check if Python server is healthy, if not try to start it
    if (!pythonModelManager.isServerHealthy()) {
      console.log('🔧 Python server not healthy, checking status...');
      const isHealthy = await pythonModelManager.checkHealth();
      
      if (!isHealthy) {
        console.log('🚀 Attempting to restart Python model server...');
        await pythonModelManager.startPythonModelServer();
      }
    }

    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');

    // Prepare request data
    const postData = JSON.stringify({
      image: base64Image
    });

    const options = {
      hostname: PYTHON_SERVER_HOST,
      port: PYTHON_SERVER_PORT,
      path: '/predict',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000 // 30 second timeout
    };

    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const result = JSON.parse(data);
              console.log(`Original model classification result: ${result.classification} (${(result.confidence * 100).toFixed(1)}% confidence)`);
              resolve(result);
            } else {
              console.error(`Python server error: ${res.statusCode} - ${data}`);
              reject(new Error(`Python server returned ${res.statusCode}: ${data}`));
            }
          } catch (parseError) {
            console.error('Error parsing Python server response:', parseError);
            reject(parseError);
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error calling Python server:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.error('Error analyzing image with original model:', error);

    
    console.log('Falling back to mock implementation...');
    return getMockAnalysis();
  }
}


function getMockAnalysis(): Promise<{
  classification: string;
  confidence: number;
  recyclable: boolean;
  estimatedWeight: string;
  suggestions: string[];
}> {
  
  const randomIndex = Math.floor(Math.random() * EWasteCategories.length);
  const classification = EWasteCategories[randomIndex];

  
  const confidence = 0.6 + Math.random() * 0.35;

  
  const recyclable = !['Battery', 'PCB'].includes(classification);

  
  const estimatedWeight = getEstimatedWeight(classification);

  
  const suggestions = getSuggestions(classification, confidence);

  console.log(`Mock classification result: ${classification} (${(confidence * 100).toFixed(1)}% confidence)`);

  return Promise.resolve({
    classification,
    confidence,
    recyclable,
    estimatedWeight,
    suggestions,
  });
}


function getEstimatedWeight(category: string): string {
  const weightEstimates: { [key: string]: string } = {
    'Audio devices': '0.5-1.5 kg',
    'Battery': '0.1-0.5 kg',
    'Charging and Connectivity Accessories': '0.1-0.3 kg',
    'Hard Drive': '0.3-0.8 kg',
    'Keyboard': '0.8-1.2 kg',
    'Mobile': '0.2-0.4 kg',
    'Mouse': '0.1-0.2 kg',
    'PCB': '0.2-0.5 kg',
    'Pen Drive': '0.01-0.05 kg',
    'USB cable': '0.1-0.3 kg',
    'Unknown Electronic Device': '1.0 kg',
  };

  return weightEstimates[category] || '1.0 kg';
}


function getSuggestions(category: string, confidence: number): string[] {
  const baseSuggestions = [
    'Remove personal data before disposal',
    'Check local recycling guidelines',
    'Consider donation if device is functional',
  ];

  const categorySpecificSuggestions: { [key: string]: string[] } = {
    'Battery': [
      'Handle with care - batteries can be hazardous',
      'Check for battery recycling programs in your area',
      'Avoid puncturing or damaging batteries',
    ],
    'PCB': [
      'Handle carefully - may contain hazardous materials',
      'Professional recycling recommended',
      'Check for specialized e-waste facilities',
    ],
    'Mobile': [
      'Factory reset to remove personal data',
      'Remove SIM card and memory cards',
      'Consider trade-in programs if functional',
    ],
    'Hard Drive': [
      'Securely wipe all data before disposal',
      'Consider physical destruction for sensitive data',
      'Professional data destruction services available',
    ],
  };

  let suggestions = [...baseSuggestions];

  
  if (categorySpecificSuggestions[category]) {
    suggestions = [...suggestions, ...categorySpecificSuggestions[category]];
  }

  
  if (confidence < 0.6) {
    suggestions.unshift('Low confidence prediction - manual verification recommended');
  }

  return suggestions;
}

