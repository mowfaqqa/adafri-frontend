import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import Contact from '../../api/whatsapp/contact';

// Contacts hook for managing contact data
export const useContacts = () => {

  // Get contact details - returns a function that can be called inside a component
  const fetchContact = useCallback(async (contactId: string) => {
    try {
      const data = await Contact.getContact(contactId);
      return data;
    } catch (error) {
      console.log('Error fetching contact details:', error);
      throw error;
    }
  }, []);

  // Search contacts
  const searchContactsMutation = useMutation({
    mutationFn: (query: string) => Contact.searchContacts(query),
  });

  // Search for contacts
  const searchContacts = useCallback((query: string) => {
    return searchContactsMutation.mutate(query);
  }, [searchContactsMutation]);

  return {
    // Functions
    fetchContact,
    searchContacts,
    
    // Data
    searchResults: searchContactsMutation.data?.results || [],
    
    // States
    isSearching: searchContactsMutation.isPending,
  };
};