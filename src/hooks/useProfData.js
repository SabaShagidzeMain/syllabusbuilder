import { useEffect, useState } from "react";
import { supabase } from "../utility/supabaseClient";

export const useProfData = () => {
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState("");
  const [syllabuses, setSyllabuses] = useState([]);
  const [profForms, setProfForms] = useState([]);
  const [loading, setLoading] = useState(true);

  /*
   * =========================================
   * FETCH PROFESSOR FORMS
   * =========================================
   */

  const fetchProfForms = async (uid) => {
    const { data, error } = await supabase
      .from("prof_forms")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching prof forms:", error.message);
      return [];
    }

    return data || [];
  };

  /*
   * =========================================
   * DEEP CLONE
   * =========================================
   */

  const cloneSections = (sections) => {
    if (!Array.isArray(sections)) {
      return [];
    }

    return JSON.parse(JSON.stringify(sections));
  };

  /*
   * =========================================
   * APPLY INSTANCE OVERRIDES
   *
   * Main syllabus:
   *
   *     content = actual sections
   *
   * Instance:
   *
   *     content = []
   *     overrides = {
   *       sectionId: {
   *         "row-cell": "value"
   *       }
   *     }
   *
   * We rebuild the instance content here.
   * =========================================
   */

  const applyOverrides = (mainContent, overrides) => {
    const result = cloneSections(mainContent);

    if (!overrides || typeof overrides !== "object") {
      return result;
    }

    result.forEach((section) => {
      const sectionOverrides = overrides[section.id];

      if (!sectionOverrides) {
        return;
      }

      Object.entries(sectionOverrides).forEach(([cellPosition, value]) => {
        const [rowIndex, cellIndex] = cellPosition.split("-").map(Number);

        if (section.cells?.[rowIndex]?.[cellIndex]) {
          section.cells[rowIndex][cellIndex].value = value;
        }
      });
    });

    return result;
  };

  /*
   * =========================================
   * LOAD EVERYTHING
   * =========================================
   */

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        /*
         * =====================================
         * GET AUTH USER
         * =====================================
         */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Auth error:", userError.message);

          return;
        }

        if (!user) {
          console.warn("No authenticated user.");
          return;
        }

        if (cancelled) {
          return;
        }

        setUserId(user.id);

        /*
         * =====================================
         * GET PROFILE
         * =====================================
         */

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("university")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Profile error:", profileError.message);

          return;
        }

        if (!profile) {
          console.error("Profile not found.");
          return;
        }

        const userUniversity = profile.university;

        setUniversity(userUniversity);

        /*
         * =====================================
         * FETCH ONLY INSTANCE SYLLABUSES
         * =====================================
         */

        const { data: instanceData, error: instanceError } = await supabase
          .from("syllabus_forms")
          .select("*")
          .eq("university", userUniversity)
          .eq("syllabus_type", "instance")
          .order("created_at", {
            ascending: false,
          });

        if (instanceError) {
          console.error(
            "Instance syllabus fetch error:",
            instanceError.message,
          );

          return;
        }

        const instances = instanceData || [];

        console.log("Professor instances:", instances);

        /*
         * =====================================
         * GET PARENT IDs
         * =====================================
         */

        const parentIds = [
          ...new Set(
            instances
              .map((instance) => instance.parent_id)
              .filter(Boolean)
              .map((id) => String(id)),
          ),
        ];

        let parents = [];

        /*
         * =====================================
         * FETCH MAIN PARENTS
         * =====================================
         */

        if (parentIds.length > 0) {
          const { data: parentData, error: parentError } = await supabase
            .from("syllabus_forms")
            .select("*")
            .in("id", parentIds);

          if (parentError) {
            console.error("Parent syllabus fetch error:", parentError.message);

            return;
          }

          parents = parentData || [];
        }

        console.log("Professor parent syllabuses:", parents);

        /*
         * =====================================
         * RESOLVE INSTANCES
         * =====================================
         *
         * Turn:
         *
         * content: []
         *
         * into:
         *
         * content: parent.content + overrides
         * =====================================
         */

        const resolvedInstances = instances.map((instance) => {
          const parent = parents.find(
            (main) => String(main.id) === String(instance.parent_id),
          );

          if (!parent) {
            console.warn(
              `Parent syllabus not found for instance ${instance.id}. Parent ID: ${instance.parent_id}`,
            );

            return {
              ...instance,
              content: [],
              parentSyllabus: null,
            };
          }

          const resolvedContent = applyOverrides(
            parent.content,
            instance.overrides,
          );

          console.log(
            `Resolved instance "${instance.title}":`,
            resolvedContent,
          );

          return {
            ...instance,

            /*
             * THIS IS THE IMPORTANT PART
             */

            content: resolvedContent,

            /*
             * Keep parent information available
             * if we need it later.
             */

            parent_id: parent.id,
            parentSyllabus: parent,
          };
        });

        if (cancelled) {
          return;
        }

        setSyllabuses(resolvedInstances);

        /*
         * =====================================
         * FETCH PROFESSOR'S OWN FORMS
         * =====================================
         */

        const profData = await fetchProfForms(user.id);

        if (cancelled) {
          return;
        }

        setProfForms(profData);
      } catch (error) {
        console.error("useProfData unexpected error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =========================================
   * RETURN
   * =========================================
   */

  return {
    userId,
    university,
    syllabuses,
    profForms,
    setProfForms,
    loading,
  };
};
