import { useEffect, useState } from "react";
import { supabase } from "../utility/supabaseClient";

export const useProfData = () => {
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState("");
  const [syllabuses, setSyllabuses] = useState([]);
  const [profForms, setProfForms] = useState([]);

  // Proper loading state
  const [loading, setLoading] = useState(true);

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
      // Start loading
      setLoading(true);

      try {
        // =========================================
        // GET CURRENT USER
        // =========================================

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Auth error:", userError.message);

          return;
        }

        if (!user) {
          console.error("No authenticated user.");

          return;
        }

        setUserId(user.id);

        // =========================================
        // FETCH PROFILE
        // =========================================

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

        // =========================================
        // FETCH SYLLABUSES
        // =========================================

        const { data: syllabusData, error: syllabusError } = await supabase
          .from("syllabus_forms")
          .select("*")
          .eq("university", profile.university);

        if (syllabusError) {
          console.error("Syllabus fetch error:", syllabusError.message);

          return;
        }

        // =========================================
        // RESOLVE INSTANCE CONTENT
        // =========================================

        const mainSyllabuses = (syllabusData || []).filter(
          (syllabus) => syllabus.syllabus_type === "main",
        );

        const resolvedSyllabuses = (syllabusData || []).map((syllabus) => {
          // Main syllabus already has its content
          if (syllabus.syllabus_type !== "instance") {
            return syllabus;
          }

          // Find the parent main syllabus
          const parent = mainSyllabuses.find(
            (main) => String(main.id) === String(syllabus.parent_id),
          );

          if (!parent) {
            console.warn(
              `Parent syllabus not found for instance ${syllabus.id}`,
            );

            return syllabus;
          }

          // Build the content the professor should see
          const resolvedContent = applyOverrides(
            parent.content,
            syllabus.overrides,
          );

          return {
            ...syllabus,

            // Keep original parent information
            parent_id: parent.id,

            // Give professor resolved content
            content: resolvedContent,

            // Keep parent available if needed
            parentSyllabus: parent,
          };
        });

        setSyllabuses(resolvedSyllabuses);

        // =========================================
        // FETCH PROFESSOR FORMS
        // =========================================

        const profData = await fetchProfForms(user.id);

        setProfForms(profData);
      } catch (error) {
        console.error("Unexpected error fetching professor data:", error);
      } finally {
        // IMPORTANT:
        // This MUST run even if there are zero results.
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    userId,
    university,
    syllabuses,
    profForms,
    setProfForms,
    loading,
  };
};
