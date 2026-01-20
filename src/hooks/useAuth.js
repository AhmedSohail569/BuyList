import {useEffect, useState} from "react";
import {getApp} from "@react-native-firebase/app";
import {getAuth, onAuthStateChanged} from "@react-native-firebase/auth";

const app = getApp();
const auth = getAuth(app);

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, authUser => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {user, loading};
};

export default useAuth;
