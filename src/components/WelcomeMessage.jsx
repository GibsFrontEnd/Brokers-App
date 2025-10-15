// src/components/WelcomeMessage.jsx
import React from 'react';
import eagle from "../assets/eagle.jpg"; // Adjust the path as necessary

const WelcomeMessage = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">
          Welcome to the GIBSLIFE Brokers Portal!
        </h1>
        <div className="flex justify-center mb-6">
          {/* Replace with your actual eagle image */}
          <img 
            src={eagle} 
            alt="GIBS Logo" 
            className="w-32 h-32 object-contain"
          />
        </div>
      </div>

      {/* Welcome Content */}
      <div className="prose max-w-none text-gray-700">
        <p className="mb-4">
          In today's fast paced, changing world customers ask more of your company every day, 
          demanding that you be more responsive, flexible and always there for them.
        </p>
        
        <p className="mb-4">
          With the adoption of Internet technology in every field those same clients are asking 
          for a better and more efficient way to manage their insurance. To help meet these 
          challenges your company must do more than simply integrate its processes—it must 
          literally be able to provide products and services to customers on demand, whenever 
          they need them. Achieving success in this environment requires an entirely new approach. 
          In short, it's never been so important for your business—and your IT infrastructure—to be flexible.
        </p>
        
        <p className="mb-4">
          GIBS™ Enterprise was specifically designed to help you meet these challenges, and to 
          allow your company to offer a level of service and efficiency that will differentiate 
          you from the rest of the industry. Through your own branded portals, you will be able 
          to offer your clients and business partners a high level of flexibility and service 
          along with cutting-edge technology that is personalized to suite their needs.
        </p>
        
        <p>
          GIBS™ Enterprise's ASP hosted model allows you to meet and surpass your clients' demands 
          and maintain the ability to grow along with your business at your own pace, increasing 
          and decreasing capacity as needed and paying for only what you use. With GIBS™ your 
          company can truly achieve this flexibility, it can compete—and win—in today's marketplace.
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage;