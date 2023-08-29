import { useParams, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function DeletePost() {
    const { id } = useParams();
    const [redirect, setRedirect] = useState(false);

    useEffect(() => {
        async function deletePost() {
            try {
                const response = await fetch(`http://localhost:4000/post/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (response.ok) {
                    setRedirect(true);
                }
            } catch (error) {
                // Handle the error
                console.error("Error deleting post:", error);
            }
        }

        deletePost();
    }, [id]);

    if (redirect) {
        return <Navigate to="/" />;
    }

    return (
        <div>Deleting post with ID: {id}</div>
    );
}
