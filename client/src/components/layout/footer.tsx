import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 justify-items-center">
          <div className="md:col-span-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <Leaf className="text-eco-green text-2xl mr-2" />
              <span className="text-xl font-bold">EcoScrap Pickup</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md mx-auto md:mx-0">
              Making e-waste disposal simple, sustainable, and rewarding. Join thousands of users making a positive environmental impact.
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              <a href="#" className="text-gray-400 hover:text-eco-green transition-colors">
                <i className="fab fa-facebook text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-eco-green transition-colors">
                <i className="fab fa-twitter text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-eco-green transition-colors">
                <i className="fab fa-instagram text-xl"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-eco-green transition-colors">
                <i className="fab fa-linkedin text-xl"></i>
              </a>
            </div>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Drone Pickup</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">E-Waste Types</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Reward Program</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Green Certificates</a></li>
            </ul>
          </div>
          
          <div className="text-center md:text-left">
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p className="text-center">&copy; 2025 EcoScrap Pickup. All rights reserved. Making the world a greener place, one pickup at a time.</p>
        </div>
      </div>
    </footer>
  );
}

