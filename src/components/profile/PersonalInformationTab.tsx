import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInformationProps {
  userInfo: {
    name: string;
    email: string;
  };
  setUserInfo: React.Dispatch<React.SetStateAction<{ name: string; email: string; }>>;
}

export const PersonalInformationTab: React.FC<PersonalInformationProps> = ({ userInfo, setUserInfo }) => {
  const handlePersonalInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement saving personal information to backend/cookies
    alert("Personal information updated!");
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
      <form onSubmit={handlePersonalInfoSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input 
              id="fullName" 
              value={userInfo.name}
              onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email"
              value={userInfo.email}
              onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input 
              id="phoneNumber" 
              type="tel"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              className="mt-1"
            />
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" type="button">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>
      </form>
    </div>
  );
};