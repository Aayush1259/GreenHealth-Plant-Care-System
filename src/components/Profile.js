import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const db = getFirestore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      }
    };
    fetchUserProfile();
  }, [db]);

  const handleUpdateProfile = async () => {
    if (user) {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, profile);
      alert('Profile updated successfully!');
    }
  };

  const goToGarden = () => {
    navigate('/garden');
  };

  const goToDisease = () => {
    navigate('/disease');
  };

  const goToIdentify = () => {
    navigate('/identify');
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="Email"
              disabled={user?.email ? true : false}
            />
          </div>
          <Button className="w-full" onClick={handleUpdateProfile}>
            Update Profile
          </Button>
          
          <div className="pt-4 grid grid-cols-3 gap-2">
            <Button onClick={goToGarden} variant="outline">
              My Garden
            </Button>
            <Button onClick={goToDisease} variant="outline">
              Disease Detection
            </Button>
            <Button onClick={goToIdentify} variant="outline">
              Plant Identification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile; 