interface UserData {
  display_name: string;
  email: string;
  id: string;
  created_at: string;
}

/*
User information about the currently logged-in user can be obtained from the /api/user/ endpoint via GET requests. An authentication token needs to be provided.

Other contributor information can be obtained individually from /api/user/{id}, where {id} is a UUID of the user. This will only provide selected properties for display purposes; currently the ID and the display name.
*/

export const getUserInfo = async (token: string): Promise<UserData | null> => {
  const response = await fetch(
    `${import.meta.env.VITE_ENDPOINT_URL}/api/user`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data;
};
