import { useEffect, useState } from "react";
import { supabase } from "../utility/supabaseClient";

export const useProfData = () => {
    const [userId, setUserId] = useState(null);
    const [university, setUniversity] = useState("");
    const [syllabuses, setSyllabuses] = useState([]);
    const [profForms, setProfForms] = useState([]);

    const fetchProfForms = async (uid) => {
        const { data, error } = await supabase
            .from("prof_forms")
            .select("*")
            .eq("user_id", uid);
        if (error) {
            console.error("Error fetching prof forms:", error.message);
            return [];
        }
        return data || [];
    };

    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("university")
                .eq("user_id", user.id)
                .single();

            if (profileError) {
                console.error("Profile error:", profileError.message);
                return;
            }
            setUniversity(profile.university);

            const { data: syllabusData, error: syllabusError } = await supabase
                .from("syllabus_forms")
                .select("*")
                .eq("university", profile.university);

            if (syllabusError) {
                console.error("Syllabus fetch error:", syllabusError.message);
                return;
            }
            setSyllabuses(syllabusData);

            const profData = await fetchProfForms(user.id);
            setProfForms(profData);
        };

        fetchData();
    }, []);

    return {
        userId,
        university,
        syllabuses,
        profForms,
        setProfForms,
    };
};
