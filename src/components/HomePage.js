import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Plant, Bug, Leaf, Users } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content */}
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-600">VerdantAI</h1>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {/* Plant Identification */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/identify')}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Plant className="h-10 w-10 text-green-500 mb-2" />
              <h2 className="text-lg font-medium text-center">Plant Identification</h2>
            </CardContent>
          </Card>
          
          {/* Disease Detection */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/disease')}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Bug className="h-10 w-10 text-orange-500 mb-2" />
              <h2 className="text-lg font-medium text-center">Disease Detection</h2>
            </CardContent>
          </Card>
          
          {/* My Garden */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/garden')}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Leaf className="h-10 w-10 text-green-600 mb-2" />
              <h2 className="text-lg font-medium text-center">My Garden</h2>
            </CardContent>
          </Card>
          
          {/* Plant Community */}
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigateTo('/community')}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Users className="h-10 w-10 text-blue-500 mb-2" />
              <h2 className="text-lg font-medium text-center">Plant Community</h2>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 