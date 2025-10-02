import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const { setUser } = useAuth();

  const handleLoginSuccess = async (response: any) => {
    console.log("Google response:", response);

    const idToken = response.credential;

    try {
      const data = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/login?id_token=${idToken}`,
        { credentials: "include" },
      ).then((res) => {
        console.log(res.headers);
        return res.json();
      });

      console.log("User authenticated:", data);
      setUser(data);

      window.location.href = `/`;
    } catch (error) {
      console.error("Error while authenticating:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 ">
      <div className="w-full max-w-md p-8 backdrop-blur-sm dark:text-gray-100">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Sign In to Ryo Cat
        </h1>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={() => console.error("Error while logging in with Google")}
        />
      </div>
    </div>
  );
}
