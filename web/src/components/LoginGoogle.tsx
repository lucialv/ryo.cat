import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function LoginGoogle() {
    const { setUser } = useAuth();

    const handleLoginSuccess = async (response: any) => {
        const idToken = response.credential;
        try {
            const data = await fetch(
                `${import.meta.env.VITE_API_URL}/v1/login?id_token=${idToken}`,
                { credentials: "include" },
            ).then((res) => {
                console.log(res.headers);
                return res.json();
            });

            console.log("👤 Usuario autenticado:", data);
            setUser(data);
        } catch (error) {
            console.error("❌ Error al verificar el token:", error);
        }
    };

    return (
        <GoogleLogin
            onSuccess={handleLoginSuccess}
            text="signin"
            locale="en_US"
            onError={() =>
                console.error("❌ Error en el login de Google")
            }
        />

    );
}