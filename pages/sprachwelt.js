/* ==========================================================
   RAFIS SPRACHWELT — INTERACTIVE ENGINE
   Chunk 1: Course Dataset & Tab Switcher Logic
========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DATASET FOR GERMAN LEVELS (A1 - B2)
    const courseData = {
        a1: {
            title: "A1 — First Steps in German",
            description: "Build confidence with simple words, pronunciation, greetings, and basic everyday communication formulas.",
            goals: [
                "Learn standard greetings and personal introductions",
                "Understand and use simple everyday questions",
                "Build an essential starter vocabulary base"
            ],
            nextStep: "Start with personal introductions, basic pronunciation rules, and simple sentence building before moving to everyday conversational structures."
        },
        a2: {
            title: "A2 — Elementary Communication",
            description: "Strengthen your daily communication matrix, expand core grammar rules, and pick up highly practical vocabulary.",
            goals: [
                "Discuss standard daily routines and environments",
                "Handle basic tasks involving travel, shopping, and work environments",
                "Understand sentences and frequently used expressions related to immediate areas"
            ],
            nextStep: "Focus on past tense structures (Perfekt), reflexive verbs, and situational roleplay handling common daily interactions."
        },
        b1: {
            title: "B1 — Independent Everyday Fluency",
            description: "Become an independent German speaker by significantly improving structural fluency, functional vocabulary, and complex interaction skills.",
            goals: [
                "Express personal opinions, dreams, and abstract experiences clearly",
                "Understand the main points of clear standard input on familiar matters",
                "Manage most linguistic situations likely to arise while travelling in German-speaking areas"
            ],
            nextStep: "Deepen your command of subordinate clauses, adjective endings, and start reading short authentic German news articles."
        },
        b2: {
            title: "B2 — Advanced Professional & Academic Skill",
            description: "Understand highly complex concrete or abstract topics, discuss nuanced ideas confidently, and prepare fully for high-level native interactions.",
            goals: [
                "Understand the main ideas of complex text on both concrete and abstract topics",
                "Interact with a degree of fluency and spontaneity that makes regular interaction with native speakers quite possible",
                "Produce clear, detailed text on a wide range of subjects"
            ],
            nextStep: "Refine complex sentence connections, master idiomatic language, and take timed mock Goethe-Zertifikat B2 examinations."
        }
    };

    // 2. DOM ELEMENTS SELECTION
    const courseCards = document.querySelectorAll('.course-card');
    const levelTitle = document.getElementById('level-title');
    const levelDescription = document.getElementById('level-description');
    const levelGoals = document.getElementById('level-goals');
    const levelNext = document.getElementById('level-next');

    // 3. TAB-SWITCHING INTERACTIVE ENGINE
    if (courseCards.length > 0 && levelTitle && levelDescription && levelGoals && levelNext) {
        courseCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove active state from current cards
                courseCards.forEach(c => c.classList.remove('active'));
                
                // Active state to the clicked card
                card.classList.add('active');

                // Extract targeting ID
                const levelKey = card.getAttribute('data-level');
                const dynamicData = courseData[levelKey];

                if (dynamicData) {
                    // Update content with clear typography injections
                    levelTitle.textContent = dynamicData.title;
                    levelDescription.textContent = dynamicData.description;
                    levelNext.textContent = dynamicData.nextStep;

                    // Rebuild the bulleted goals array cleanly
                    levelGoals.innerHTML = '';
                    dynamicData.goals.forEach(goal => {
                        const li = document.createElement('li');
                        li.textContent = goal;
                        levelGoals.appendChild(li);
                    });
                }
            });
        });
    }
    /* ==========================================================
   RAFIS SPRACHWELT — INTERACTIVE ENGINE
   Chunk 2: Smooth Scrolling, FAQ Exclusive State & Global Init
========================================================== */

    // 4. EXCLUSIVE ACCORDION (FAQ) MUTEX LOGIC
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const summary = item.querySelector('summary');
            
            summary.addEventListener('click', (e) => {
                // Prevent immediate toggle to handle closing animations if needed
                // If opening this item, close all other open elements safely
                if (!item.hasAttribute('open')) {
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.hasAttribute('open')) {
                            otherItem.removeAttribute('open');
                        }
                    });
                }
            });
        });
    }

    // 5. SMOOTH SCROLL ENHANCEMENTS WITH HEADER OFFSET
    const siteHeader = document.querySelector('.site-header');
    const interactiveLinks = document.querySelectorAll('a[href^="#"]');

    interactiveLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Calculate responsive top margin dynamically
                const headerOffset = siteHeader ? siteHeader.offsetHeight : 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 6. DYNAMIC SCROLL INDICATOR VISIBILITY TRACKING
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 150) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.visibility = 'hidden';
                scrollIndicator.style.transition = 'opacity .4s ease, visibility .4s ease';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.visibility = 'visible';
            }
        });
    }
});