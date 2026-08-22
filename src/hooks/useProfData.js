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

    /*
     * Applies instance overrides on top of the main syllabus content.
     */
    const applyOverrides = (mainContent, overrides) => {
        if (!Array.isArray(mainContent)) {
            return [];
        }

        if (!overrides || typeof overrides !== "object") {
            return mainContent;
        }

        return mainContent.map((section) => {
            const sectionOverride = overrides[section.id];

            if (!sectionOverride) {
                return section;
            }

            return {
                ...section,
                ...sectionOverride,
                cells: sectionOverride.cells || section.cells,
            };
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) return;

            setUserId(user.id);

            // -----------------------------
            // FETCH PROFILE
            // -----------------------------

            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("university")
                .eq("user_id", user.id)
                .single();

            if (profileError) {
                console.error(
                    "Profile error:",
                    profileError.message
                );
                return;
            }

            setUniversity(profile.university);

            // -----------------------------
            // FETCH SYLLABUSES
            // -----------------------------

            const {
                data: syllabusData,
                error: syllabusError,
            } = await supabase
                .from("syllabus_forms")
                .select("*")
                .eq("university", profile.university);

            if (syllabusError) {
                console.error(
                    "Syllabus fetch error:",
                    syllabusError.message
                );
                return;
            }

            // -----------------------------
            // RESOLVE INSTANCE CONTENT
            // -----------------------------

            const mainSyllabuses = (syllabusData || []).filter(
                (syllabus) =>
                    syllabus.syllabus_type === "main"
            );

            const resolvedSyllabuses = (syllabusData || []).map(
                (syllabus) => {
                    // Main syllabus already has its content
                    if (syllabus.syllabus_type !== "instance") {
                        return syllabus;
                    }

                    // Find the parent main syllabus
                    const parent = mainSyllabuses.find(
                        (main) =>
                            String(main.id) ===
                            String(syllabus.parent_id)
                    );

                    if (!parent) {
                        console.warn(
                            `Parent syllabus not found for instance ${syllabus.id}`
                        );

                        return syllabus;
                    }

                    // Build the content the professor should see
                    const resolvedContent = applyOverrides(
                        parent.content,
                        syllabus.overrides
                    );

                    return {
                        ...syllabus,

                        // Keep the original parent information
                        parent_id: parent.id,

                        // Give the professor the resolved content
                        content: resolvedContent,

                        // Useful if we need it later
                        parentSyllabus: parent,
                    };
                }
            );

            setSyllabuses(resolvedSyllabuses);

            // -----------------------------
            // FETCH PROFESSOR FORMS
            // -----------------------------

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