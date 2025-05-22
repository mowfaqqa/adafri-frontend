"use client";
import React, { useState } from "react";
import { MapPin, Home, User2, Pencil, X } from "lucide-react";

interface InformationCardProps {
  location?: string;
  address?: string;
  billingName?: string;
}

export const InformationCard: React.FC<InformationCardProps> = ({
  location = "Dakar",
  address = "Thermoz",
  billingName = "Abdou C. Dieng"
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    location,
    address,
    billingName
  });
  const [editedData, setEditedData] = useState({
    location,
    address,
    billingName
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditedData(formData); // Reset to current values if canceled
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData(editedData);
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-900 font-medium">Informations</h3>
        <button 
          className="text-gray-600 hover:text-gray-900"
          onClick={openModal}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center">
          <div className="w-6 h-6 flex items-center justify-center mr-2">
            <MapPin className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm text-gray-800">
            <span className="text-gray-500">Location:</span> {formData.location}
          </span>
        </div>
        
        <div className="flex items-center">
          <div className="w-6 h-6 flex items-center justify-center mr-2">
            <Home className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm text-gray-800">
            <span className="text-gray-500">Address:</span> {formData.address}
          </span>
        </div>
        
        <div className="flex items-center">
          <div className="w-6 h-6 flex items-center justify-center mr-2">
            <User2 className="w-4 h-4 text-gray-600" />
          </div>
          <span className="text-sm text-gray-800">
            <span className="text-gray-500">Billing name:</span> {formData.billingName}
          </span>
        </div>
      </div>

      {/* Edit Information Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Information</h3>
              <button 
                className="text-gray-500 hover:text-gray-700"
                onClick={closeModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={editedData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={editedData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="billingName" className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Name
                  </label>
                  <input
                    type="text"
                    id="billingName"
                    name="billingName"
                    value={editedData.billingName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};