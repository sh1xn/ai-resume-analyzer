// ================= THEME TOGGLE =================

const toggleButton =
    document.getElementById(
        "theme-toggle"
    );

toggleButton.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light-mode"
        );

        toggleButton.innerHTML =
            document.body.classList.contains(
                "light-mode"
            )
            ? "🌙"
            : "☀️";
    }
);

// ================= SCROLLSPY NAVBAR =================

const sections =
    document.querySelectorAll(
        "section"
    );

const navLinks =
    document.querySelectorAll(
        ".nav-link"
    );

window.addEventListener(
    "scroll",
    () => {

        let current = "";

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop - 150;

            if (
                window.scrollY >= sectionTop
            ) {

                current =
                    section.getAttribute(
                        "id"
                    );
            }
        });

        navLinks.forEach(link => {

            link.classList.remove(
                "active"
            );

            if (
                link.getAttribute("href")
                === `#${current}`
            ) {

                link.classList.add(
                    "active"
                );
            }
        });
    }
);

// ================= ANALYSIS SECTION =================

const grammarBtn =
    document.getElementById(
        "grammar-btn"
    );

const grammarOutput =
    document.getElementById(
        "grammar-output"
    );

const resumeUpload =
    document.getElementById(
        "resume-upload"
    );

grammarBtn.addEventListener(
    "click",

    async (e) => {

        e.preventDefault();

        const file =
            resumeUpload.files[0];

        grammarOutput.classList.remove(
            "hidden"
        );

        grammarBtn.disabled = true;

        grammarBtn.textContent =
            "Analyzing...";

        try {

            if (file) {

                const allowedTypes = [

                    "application/pdf",

                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ];

                if (
                    !allowedTypes.includes(
                        file.type
                    )
                ) {

                    grammarOutput.innerHTML =
                        "Please upload a PDF or DOCX file only.";

                    grammarBtn.disabled = false;

                    grammarBtn.textContent =
                        "Analyze Resume";

                    return;
                }

                grammarOutput.innerHTML =
                    "Analyzing Resume...";

                const formData =
                    new FormData();

                formData.append(
                    "resume",
                    file
                );

                const response =
                    await fetch(
                        "/api/analyze",
                        {
                            method: "POST",
                            body: formData
                        }
                    );

                const data =
                    await response.json();

                const scoreMatch =
                    data.analysis.match(
                        /(\d+)\/100/
                    );

                if (scoreMatch) {

                    document.querySelector(
                        ".score-container"
                    ).classList.remove(
                        "hidden-score"
                    );

                    const score =
                        parseInt(
                            scoreMatch[1]
                        );

                    document.getElementById(
                        "score-number"
                    ).textContent =
                        `${score}%`;

                    const circle =
                        document.querySelector(
                            ".score-meter"
                        );

                    const radius = 120;

                    const circumference =
                        2 * Math.PI * radius;

                    const offset =
                        circumference -
                        (
                            score / 100
                        ) *
                        circumference;

                    circle.style.strokeDasharray =
                        circumference;

                    circle.style.strokeDashoffset =
                        offset;
                }

                const analysisText =
                    data.analysis ||
                    "No analysis returned.";

                grammarOutput.innerHTML = `
                    <p>
                        ${analysisText
                            .replace(
                                /\*\*(.*?)\*\*/g,
                                "<strong>$1</strong>"
                            )
                            .replace(
                                /\n/g,
                                "<br>"
                            )}
                    </p>
                `;
            }

            else {

                grammarOutput.innerHTML =
                    "Please upload a resume.";
            }

        }

        catch (error) {

            console.error(error);

            grammarOutput.innerHTML =
                "Could not connect to backend server.";
        }

        finally {

            grammarBtn.disabled =
                false;

            grammarBtn.textContent =
                "Analyze Resume";
        }
    }
);