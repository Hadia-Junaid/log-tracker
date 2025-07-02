import axios from 'axios';

export interface DirectoryUser {
  name: string;
  email: string;
}

export const fetchUserFromDirectory = async (email: string): Promise<DirectoryUser | null> => {
  try {
    const response = await axios.get(`http://localhost:5000/api/directory/user?email=${email}`);
    if (response.status === 200 && response.data) {
      return {
        name: response.data.name,
        email: response.data.email
      };
    }
    return null;
  } catch (error) {
    console.error(`❌ Failed to fetch user from directory API for ${email}:`, error);
    return null;
  }
};
