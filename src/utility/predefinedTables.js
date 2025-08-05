export const predefinedTables = [
    {
        id: "1",
        name: "2x1 Table",
        cells: [
            [
                { value: "", isTitle: true, tag: "title-1" },
                { value: "", tag: "for-title-1" },
            ],
        ],
    },
    {
        id: "2",
        name: "title Left - 2 Cells",
        cells: [
            [
                { value: "", isTitle: true, isFullHeight: true, tag: "title-1", rowSpan: 2 },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
        ],
    },
    {
        id: "3",
        name: "Title Left - 3 Cells",
        cells: [
            [
                { value: "", isTitle: true, isFullHeight: true, tag: "title-1", rowSpan: 3 },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
        ]
    },
    {
        id: "4",
        name: "Title Left - 4 Cells",
        cells: [
            [
                { value: "", isTitle: true, isFullHeight: true, tag: "title-1", rowSpan: 4 },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
        ],
    },
    {
        id: "5",
        name: "Title Left - 2x3 Table",
        cells: [
            [
                { value: "", isTitle: true, isFullHeight: true, tag: "title-1", rowSpan: 4 },
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
        ],
    },
    {
        id: "6",
        name: "title Left - 2x6 Table",
        cells: [
            [
                { value: "", isTitle: true, isFullHeight: true, tag: "title-1", rowSpan: 6 },
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-1" },
            ],
        ],
    },
    {
        id: "7",
        name: "title Left - 9 Cells",
        cells: [
            [
                { value: "", isTitle: true, isFullHeight: true, tag: "title-1", rowSpan: 9 },
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
            [
                { value: "", tag: "for-title-1" },
            ],
        ],
    },
    {
        id: "8",
        name: "Calendar Table",
        cells: [
            // Header row
            [
                { value: "Week", isTitle: true, isFullHeight: true, tag: "title-1" },
                { value: "Topic, Homework, Literature N." },
            ],
            // Row 1
            [
                { value: "I", isTitle: true, tag: "title-2", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-2" }],
            [{ value: "", tag: "for-title-2" }],
            [{ value: "", tag: "for-title-2" }],
            [{ value: "", tag: "for-title-2" }],
            [{ value: "", tag: "for-title-2" }],
            [{ value: "", tag: "for-title-2" }],
            [{ value: "", tag: "for-title-2" }],
            // Row 2
            [
                { value: "II", isTitle: true, tag: "title-3", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-3" }],
            [{ value: "", tag: "for-title-3" }],
            [{ value: "", tag: "for-title-3" }],
            [{ value: "", tag: "for-title-3" }],
            [{ value: "", tag: "for-title-3" }],
            [{ value: "", tag: "for-title-3" }],
            [{ value: "", tag: "for-title-3" }],
            // Row 3
            [
                { value: "III", isTitle: true, tag: "title-4", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-4" }],
            [{ value: "", tag: "for-title-4" }],
            [{ value: "", tag: "for-title-4" }],
            [{ value: "", tag: "for-title-4" }],
            [{ value: "", tag: "for-title-4" }],
            [{ value: "", tag: "for-title-4" }],
            [{ value: "", tag: "for-title-4" }],
            // Row 4
            [
                { value: "IV", isTitle: true, tag: "title-5", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-5" }],
            [{ value: "", tag: "for-title-5" }],
            [{ value: "", tag: "for-title-5" }],
            [{ value: "", tag: "for-title-5" }],
            [{ value: "", tag: "for-title-5" }],
            [{ value: "", tag: "for-title-5" }],
            [{ value: "", tag: "for-title-5" }],
            // Row 5
            [
                { value: "V", isTitle: true, tag: "title-6", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-6" }],
            [{ value: "", tag: "for-title-6" }],
            [{ value: "", tag: "for-title-6" }],
            [{ value: "", tag: "for-title-6" }],
            [{ value: "", tag: "for-title-6" }],
            [{ value: "", tag: "for-title-6" }],
            [{ value: "", tag: "for-title-6" }],
            // Row 6
            [
                { value: "VI", isTitle: true, tag: "title-7", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-7" }],
            [{ value: "", tag: "for-title-7" }],
            [{ value: "", tag: "for-title-7" }],
            [{ value: "", tag: "for-title-7" }],
            [{ value: "", tag: "for-title-7" }],
            [{ value: "", tag: "for-title-7" }],
            [{ value: "", tag: "for-title-7" }],
            // Row 7
            [
                { value: "VII", isTitle: true, tag: "title-8", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-8" }],
            [{ value: "", tag: "for-title-8" }],
            [{ value: "", tag: "for-title-8" }],
            [{ value: "", tag: "for-title-8" }],
            [{ value: "", tag: "for-title-8" }],
            [{ value: "", tag: "for-title-8" }],
            [{ value: "", tag: "for-title-8" }],
            // Row 8
            [
                { value: "VIII", isTitle: true, tag: "title-9" },
                { value: "Midterm Exam" },
            ],
            // Row 9
            [
                { value: "IX", isTitle: true, tag: "title-10", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-10" }],
            [{ value: "", tag: "for-title-10" }],
            [{ value: "", tag: "for-title-10" }],
            [{ value: "", tag: "for-title-10" }],
            [{ value: "", tag: "for-title-10" }],
            [{ value: "", tag: "for-title-10" }],
            [{ value: "", tag: "for-title-10" }],
            // Row 10
            [
                { value: "X", isTitle: true, tag: "title-11", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-11" }],
            [{ value: "", tag: "for-title-11" }],
            [{ value: "", tag: "for-title-11" }],
            [{ value: "", tag: "for-title-11" }],
            [{ value: "", tag: "for-title-11" }],
            [{ value: "", tag: "for-title-11" }],
            [{ value: "", tag: "for-title-11" }],
            // Row 11
            [
                { value: "XI", isTitle: true, tag: "title-12", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-12" }],
            [{ value: "", tag: "for-title-12" }],
            [{ value: "", tag: "for-title-12" }],
            [{ value: "", tag: "for-title-12" }],
            [{ value: "", tag: "for-title-12" }],
            [{ value: "", tag: "for-title-12" }],
            [{ value: "", tag: "for-title-12" }],
            // Row 12
            [
                { value: "XII", isTitle: true, tag: "title-13", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-13" }],
            [{ value: "", tag: "for-title-13" }],
            [{ value: "", tag: "for-title-13" }],
            [{ value: "", tag: "for-title-13" }],
            [{ value: "", tag: "for-title-13" }],
            [{ value: "", tag: "for-title-13" }],
            [{ value: "", tag: "for-title-13" }],
            // Row 13
            [
                { value: "XIII", isTitle: true, tag: "title-14", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-14" }],
            [{ value: "", tag: "for-title-14" }],
            [{ value: "", tag: "for-title-14" }],
            [{ value: "", tag: "for-title-14" }],
            [{ value: "", tag: "for-title-14" }],
            [{ value: "", tag: "for-title-14" }],
            [{ value: "", tag: "for-title-14" }],
            // Row 14
            [
                { value: "XIV", isTitle: true, tag: "title-15", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-15" }],
            [{ value: "", tag: "for-title-15" }],
            [{ value: "", tag: "for-title-15" }],
            [{ value: "", tag: "for-title-15" }],
            [{ value: "", tag: "for-title-15" }],
            [{ value: "", tag: "for-title-15" }],
            [{ value: "", tag: "for-title-15" }],
            // Row 15
            [
                { value: "XV", isTitle: true, tag: "title-16", rowSpan: 8 },
                { value: "Topic and Subtopics/tasks" },
            ],
            [{ value: "", tag: "for-title-16" }],
            [{ value: "", tag: "for-title-16" }],
            [{ value: "", tag: "for-title-16" }],
            [{ value: "", tag: "for-title-16" }],
            [{ value: "", tag: "for-title-16" }],
            [{ value: "", tag: "for-title-16" }],
            [{ value: "", tag: "for-title-16" }],
            // Row 16
            [
                { value: "XVI", isTitle: true, tag: "title-17" },
                { value: "Midterm Exam" },
            ],
            // Row 17/18
            [
                { value: "XVII /XVIII", isTitle: true, tag: "title-18" },
                { value: "Retake midterm exam" },
            ],
            // Row 19
            [
                { value: "XIX", isTitle: true, tag: "title-19" },
                { value: "Final exam" },
            ],
            // Row 20
            [
                { value: "Additional Information", isTitle: true, tag: "title-20" },
                { value: "Retake Final Exam" },
            ],
        ],
    },
    {
        id: "9",
        name: "Assessment Map",
        cells: [
            // Row 1: full-width header
            [{ value: "Assessment map of learning outcomes", isTitle: true, isFullWidth: true, tag: "top-title" }],

            // Row 2: table headers
            [
                { value: "Learning outcome of a course", isTitle: true, tag: "title-1" },
                { value: "Learning outcome of a programme", isTitle: true, tag: "title-2" },
                { value: "Assessment method (e.g: test/quiz/project and etc)", isTitle: true, tag: "title-3" },
            ],

            // Row 3
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-2" },
                { value: "", tag: "for-title-3" },
            ],

            // Row 4
            [
                { value: "", tag: "for-title-1" },
                { value: "", tag: "for-title-2" },
                { value: "", tag: "for-title-3" },
            ],

            // Row 5
            [
                { value: "Threshhold", tag: "for-title-1", rowSpan: 2 },
                { value: "Student", tag: "for-title-2", },
                { value: "...%", tag: "for-title-2", },
            ],
            [
                { value: "Point", tag: "for-title-2" },
                { value: "...p", tag: "for-title-2" },
            ]
        ],
    },
    {
        id: "10",
        name: "2x1 Table",
        cells: [
            [{ value: "", isTitle: true, isFullWidth: true, tag: "title-1" }],
            [
                { value: "", isFullWidth: true, tag: "for-title-1" },
            ],
        ]
    }
];
