import { useState, useRef, useEffect } from "react";
import { inject } from "@vercel/analytics";
import AuthPage from "./Auth.jsx";
import SponsorsPage from "./Sponsors.jsx";
import Dashboard from "./Dashboard.jsx";
import { PrivacyPage, TermsPage, CookieBanner } from "./Legal.jsx";

inject();

const NAV_LINKS = ["Home", "AI Mentor", "Education Paths", "UK Universities", "Sponsorship Jobs", "Visa Sponsors", "Contact", "My Profile"];
const SECTORS = ["All", "Technology", "AI & Data", "Healthcare", "Finance", "Engineering", "Business", "Education", "Hospitality", "Public Sector"];
const VISA_TYPES = ["All Jobs", "✓ Visa Sponsorship"];
const JOBS_PER_PAGE = 20;

const EDUCATION_SYSTEMS = [
  { country: "🇬🇧 United Kingdom", systems: ["GCSE", "A-Levels", "BTEC", "Scottish Highers"] },
  { country: "🇮🇳 India", systems: ["CBSE", "ICSE", "State Boards"] },
  { country: "🇺🇸 USA", systems: ["High School Diploma", "AP", "SAT/ACT"] },
  { country: "🇳🇬 Nigeria", systems: ["WAEC", "NECO", "JAMB"] },
  { country: "🇵🇰 Pakistan", systems: ["Intermediate/FSc", "Matric", "O/A Levels"] },
  { country: "🌍 International", systems: ["IB", "EU Systems", "Middle East Curricula"] },
];

const UK_UNIVERSITIES = [
  { name: "University of Oxford", rank: "#1 UK", focus: "Research & Humanities", entry: "AAA at A-Level", intl: "IELTS 7.0+", scholarships: "Rhodes, Clarendon" },
  { name: "University of Cambridge", rank: "#2 UK", focus: "STEM & Research", entry: "A*AA at A-Level", intl: "IELTS 7.5+", scholarships: "Gates Cambridge" },
  { name: "Imperial College London", rank: "#3 UK", focus: "Engineering & Medicine", entry: "A*AA at A-Level", intl: "IELTS 6.5+", scholarships: "Imperial Bursaries" },
  { name: "University of Edinburgh", rank: "#5 UK", focus: "Medicine & Law", entry: "AAA at A-Level", intl: "IELTS 6.5+", scholarships: "Edinburgh Global" },
  { name: "University of Manchester", rank: "#8 UK", focus: "Business & Technology", entry: "AAB at A-Level", intl: "IELTS 6.5+", scholarships: "President's Award" },
  { name: "King's College London", rank: "#6 UK", focus: "Medicine & Law", entry: "AAB at A-Level", intl: "IELTS 7.0+", scholarships: "King's Scholarships" },
];

// ✅ Full German universities list — 155 institutions across all types
const GERMAN_UNIVERSITIES = [
  // ── Top Research Universities (Exzellenzuniversitäten) ──
  { name: "Technical University of Munich (TUM)", type: "Public", focus: "Engineering & Technology", tuition: "Free (€143/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "#1 DE", website: "https://www.tum.de/en/" },
  { name: "Ludwig Maximilian University of Munich (LMU)", type: "Public", focus: "Medicine, Law & Humanities", tuition: "Free (€143/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, LMU Excellence", rank: "#2 DE", website: "https://www.lmu.de/en/" },
  { name: "Heidelberg University", type: "Public", focus: "Life Sciences & Medicine", tuition: "Free (€185/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Heidelberg Excellence", rank: "#3 DE", website: "https://www.uni-heidelberg.de/en" },
  { name: "Humboldt University of Berlin", type: "Public", focus: "Research & Social Sciences", tuition: "Free (€315/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "#4 DE", website: "https://www.hu-berlin.de/en" },
  { name: "RWTH Aachen University", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€275/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, RWTH Excellence", rank: "#5 DE", website: "https://www.rwth-aachen.de" },
  { name: "Freie Universität Berlin", type: "Public", focus: "Politics & International Studies", tuition: "Free (€315/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, FU Excellence", rank: "#6 DE", website: "https://www.fu-berlin.de/en/" },
  { name: "University of Tübingen", type: "Public", focus: "Humanities, Medicine & Science", tuition: "Free (€175/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://uni-tuebingen.de/en/" },
  { name: "University of Freiburg", type: "Public", focus: "Life Sciences & Humanities", tuition: "Free (€165/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://uni-freiburg.de/en/" },
  { name: "University of Konstanz", type: "Public", focus: "Social Sciences & Natural Sciences", tuition: "Free (€160/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Zukunftskolleg", rank: "Excellence Uni", website: "https://www.uni-konstanz.de/en/" },
  { name: "University of Bonn", type: "Public", focus: "Mathematics, Natural Sciences & Medicine", tuition: "Free (€300/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://www.uni-bonn.de/en" },
  { name: "Dresden University of Technology (TU Dresden)", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€275/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://tu-dresden.de/en" },
  { name: "Karlsruhe Institute of Technology (KIT)", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€175/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, KIT Excellence", rank: "Excellence Uni", website: "https://www.kit.edu/english/" },
  { name: "University of Hamburg", type: "Public", focus: "Natural Sciences & Humanities", tuition: "Free (€340/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://www.uni-hamburg.de/en.html" },
  { name: "University of Cologne", type: "Public", focus: "Business, Law & Medicine", tuition: "Free (€295/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://www.uni-koeln.de/en/" },
  { name: "University of Münster", type: "Public", focus: "Law, Economics & Natural Sciences", tuition: "Free (€310/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://www.uni-muenster.de/en/" },
  { name: "University of Bremen", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://www.uni-bremen.de/en/" },
  { name: "University of Bayreuth", type: "Public", focus: "Natural Sciences & Law", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Excellence Uni", website: "https://www.uni-bayreuth.de/en/" },
  // ── Major Research Universities ──
  { name: "Goethe University Frankfurt", type: "Public", focus: "Finance, Law & Social Sciences", tuition: "Free (€315/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.goethe-university-frankfurt.de/en" },
  { name: "University of Stuttgart", type: "Public", focus: "Engineering & Technology", tuition: "Free (€190/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.uni-stuttgart.de/en/" },
  { name: "University of Erlangen-Nuremberg (FAU)", type: "Public", focus: "Engineering, Medicine & Humanities", tuition: "Free (€130/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.fau.eu/" },
  { name: "University of Würzburg", type: "Public", focus: "Medicine & Natural Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-wuerzburg.de/en/home/" },
  { name: "University of Mannheim", type: "Public", focus: "Business & Social Sciences", tuition: "Free (€170/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Business", website: "https://www.uni-mannheim.de/en/" },
  { name: "University of Mainz (JGU)", type: "Public", focus: "Humanities, Natural Sciences & Medicine", tuition: "Free (€295/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-mainz.de/eng/" },
  { name: "University of Düsseldorf (HHU)", type: "Public", focus: "Medicine, Law & Natural Sciences", tuition: "Free (€300/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.hhu.de/en/" },
  { name: "University of Bochum (RUB)", type: "Public", focus: "Engineering, Natural Sciences & Humanities", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.ruhr-uni-bochum.de/en/" },
  { name: "University of Bielefeld", type: "Public", focus: "Social Sciences & Natural Sciences", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-bielefeld.de/en/" },
  { name: "University of Duisburg-Essen", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-due.de/en/" },
  { name: "University of Leipzig", type: "Public", focus: "Medicine, Humanities & Social Sciences", tuition: "Free (€233/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-leipzig.de/en/" },
  { name: "University of Göttingen", type: "Public", focus: "Natural Sciences & Humanities", tuition: "Free (€395/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Göttingen International", rank: "Top Research", website: "https://www.uni-goettingen.de/en/" },
  { name: "University of Jena (FSU)", type: "Public", focus: "Natural Sciences & Humanities", tuition: "Free (€245/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-jena.de/en" },
  { name: "University of Kiel (CAU)", type: "Public", focus: "Natural Sciences & Medicine", tuition: "Free (€355/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-kiel.de/en/" },
  { name: "University of Marburg", type: "Public", focus: "Medicine, Pharmacy & Humanities", tuition: "Free (€285/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-marburg.de/en" },
  { name: "University of Halle-Wittenberg (MLU)", type: "Public", focus: "Natural Sciences & Humanities", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-halle.de/en/" },
  { name: "University of Regensburg", type: "Public", focus: "Law, Medicine & Natural Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-regensburg.de/index.html.en" },
  { name: "University of Augsburg", type: "Public", focus: "Business, Law & Natural Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-augsburg.de/en/" },
  { name: "University of Ulm", type: "Public", focus: "Medicine & Engineering", tuition: "Free (€178/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-ulm.de/en/home.html" },
  { name: "University of Giessen (JLU)", type: "Public", focus: "Agriculture, Medicine & Humanities", tuition: "Free (€285/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-giessen.de/en" },
  { name: "University of Kassel", type: "Public", focus: "Social Sciences & Engineering", tuition: "Free (€285/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-kassel.de/en/" },
  { name: "University of Oldenburg (UOL)", type: "Public", focus: "Natural Sciences & Social Sciences", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://uol.de/en" },
  { name: "University of Osnabrück", type: "Public", focus: "Natural Sciences & Humanities", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-osnabrueck.de/en/" },
  { name: "University of Paderborn", type: "Public", focus: "Computer Science & Engineering", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-paderborn.de/en/" },
  { name: "University of Siegen", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-siegen.de/start/index.html.en" },
  { name: "University of Wuppertal (BUW)", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-wuppertal.de/en/" },
  { name: "Charité – Universitätsmedizin Berlin", type: "Public", focus: "Medicine & Health Sciences", tuition: "Free (€315/sem)", intl: "German C1 required", scholarships: "DAAD, Helmholtz scholarships", rank: "Top Medical", website: "https://www.charite.de/en/" },
  { name: "University of Greifswald", type: "Public", focus: "Medicine & Natural Sciences", tuition: "Free (€377/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-greifswald.de/en/" },
  { name: "University of Rostock", type: "Public", focus: "Maritime Studies & Engineering", tuition: "Free (€377/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-rostock.de/en/" },
  { name: "University of Magdeburg (OVGU)", type: "Public", focus: "Engineering & Medicine", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.ovgu.de/en/" },
  { name: "Technische Universität Berlin (TU Berlin)", type: "Public", focus: "Engineering & Computer Science", tuition: "Free (€315/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.tu.berlin/en/" },
  { name: "Technische Universität Braunschweig", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.tu-braunschweig.de/en/" },
  { name: "Technische Universität Chemnitz", type: "Public", focus: "Engineering & Computer Science", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.tu-chemnitz.de/index.html.en" },
  { name: "Technische Universität Darmstadt", type: "Public", focus: "Engineering & Computer Science", tuition: "Free (€280/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.tu-darmstadt.de/index.en.jsp" },
  { name: "Technische Universität Hamburg (TUHH)", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€340/sem)", intl: "IELTS 6.5+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.tuhh.de/tuhh/en/" },
  { name: "Technische Universität Ilmenau", type: "Public", focus: "Engineering & Computer Science", tuition: "Free (€245/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.tu-ilmenau.de/en/" },
  { name: "Technische Universität Kaiserslautern-Landau (RPTU)", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€300/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.rptu.de/en" },
  { name: "Brandenburg University of Technology (BTU)", type: "Public", focus: "Engineering & Natural Sciences", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Engineering", website: "https://www.b-tu.de/en/" },
  { name: "University of Passau", type: "Public", focus: "Law, Business & Computer Science", tuition: "Free (€130/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-passau.de/en/" },
  { name: "Saarland University", type: "Public", focus: "Computer Science & Natural Sciences", tuition: "Free (€290/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-saarland.de/en/home.html" },
  { name: "University of Bamberg", type: "Public", focus: "Humanities & Social Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-bamberg.de/en/" },
  { name: "University of Potsdam", type: "Public", focus: "Natural Sciences & Law", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-potsdam.de/en/" },
  { name: "Europa-Universität Viadrina Frankfurt (Oder)", type: "Public", focus: "Law & Cultural Studies", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.europa-uni.de/en/index.html" },
  { name: "University of Erfurt", type: "Public", focus: "Humanities & Social Sciences", tuition: "Free (€245/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-erfurt.de/en/" },
  { name: "University of Hildesheim", type: "Public", focus: "Education & Cultural Sciences", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-hildesheim.de/en/" },
  { name: "University of Lübeck", type: "Public", focus: "Medicine & Computer Science", tuition: "Free (€355/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Medical", website: "https://www.uni-luebeck.de/en/university.html" },
  { name: "Leuphana University Lüneburg", type: "Public", focus: "Sustainability & Business", tuition: "Free (€380/sem)", intl: "IELTS 6.5+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.leuphana.de/en.html" },
  { name: "Catholic University of Eichstätt-Ingolstadt (KU)", type: "Public", focus: "Theology, Social Sciences & Business", tuition: "Free (€435/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, KU scholarships", rank: "Top Research", website: "https://www.ku.de/en/" },
  { name: "University of Trier", type: "Public", focus: "Law, Humanities & Social Sciences", tuition: "Free (€290/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-trier.de" },
  { name: "University of Koblenz (UKO)", type: "Public", focus: "Computer Science & Social Sciences", tuition: "Free (€290/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-koblenz.de/en" },
  { name: "University of Flensburg (EUF)", type: "Public", focus: "Business & Education", tuition: "Free (€355/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-flensburg.de/en/" },
  { name: "University of Vechta", type: "Public", focus: "Social Sciences & Humanities", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German C1", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Research", website: "https://www.uni-vechta.de/en/" },
  // ── Universities of Applied Sciences (Fachhochschulen) ──
  { name: "Munich University of Applied Sciences (HM)", type: "Public", focus: "Engineering, Business & Design", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hm.edu/en/" },
  { name: "Cologne University of Applied Sciences (TH Köln)", type: "Public", focus: "Engineering, Business & Social Work", tuition: "Free (€295/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.th-koeln.de/en/" },
  { name: "Berlin University of Applied Sciences (HTW Berlin)", type: "Public", focus: "Engineering, Business & Design", tuition: "Free (€315/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.htw-berlin.de/en/" },
  { name: "Berlin University of Applied Sciences (BHT)", type: "Public", focus: "Engineering & Life Sciences", tuition: "Free (€315/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.bht-berlin.de/en" },
  { name: "Hamburg University of Applied Sciences (HAW Hamburg)", type: "Public", focus: "Engineering, Business & Social Sciences", tuition: "Free (€340/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.haw-hamburg.de/en/" },
  { name: "Dortmund University of Applied Sciences (FH Dortmund)", type: "Public", focus: "Engineering, Business & Design", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.fh-dortmund.de/en/" },
  { name: "Frankfurt University of Applied Sciences", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€315/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.frankfurt-university.de/en/" },
  { name: "Nuremberg Institute of Technology (TH Nürnberg)", type: "Public", focus: "Engineering, Business & Social Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.th-nuernberg.de/en/" },
  { name: "Stuttgart Media University (HdM)", type: "Public", focus: "Media, Publishing & Information Science", tuition: "Free (€190/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hdm-stuttgart.de/en" },
  { name: "Reutlingen University", type: "Public", focus: "Business, Engineering & Computer Science", tuition: "Free (€190/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.reutlingen-university.de/en/" },
  { name: "Aalen University", type: "Public", focus: "Engineering & Business", tuition: "Free (€190/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-aalen.de/en/" },
  { name: "Esslingen University of Applied Sciences", type: "Public", focus: "Engineering & Management", tuition: "Free (€190/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-esslingen.de/en/" },
  { name: "Pforzheim University", type: "Public", focus: "Business, Engineering & Design", tuition: "Free (€190/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-pforzheim.de/en/" },
  { name: "Konstanz University of Applied Sciences (HTWG)", type: "Public", focus: "Engineering & Business", tuition: "Free (€165/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.htwg-konstanz.de/en/" },
  { name: "Mittweida University of Applied Sciences", type: "Public", focus: "Engineering & Media", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-mittweida.de/en/" },
  { name: "Fulda University of Applied Sciences", type: "Public", focus: "Social Work, Nutrition & Business", tuition: "Free (€285/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-fulda.de/en/" },
  { name: "Heilbronn University", type: "Public", focus: "Business & Engineering", tuition: "Free (€190/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-heilbronn.de/en" },
  { name: "Furtwangen University (HFU)", type: "Public", focus: "Computer Science & Engineering", tuition: "Free (€165/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hfu.eu/" },
  { name: "Offenburg University", type: "Public", focus: "Engineering & Media", tuition: "Free (€165/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-offenburg.de/en/" },
  { name: "Ravensburg-Weingarten University (RWU)", type: "Public", focus: "Engineering & Business", tuition: "Free (€190/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.rwu.de/en/" },
  { name: "Hochschule Niederrhein", type: "Public", focus: "Textile & Chemical Engineering", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-niederrhein.de/en/" },
  { name: "Bielefeld University of Applied Sciences (FH Bielefeld)", type: "Public", focus: "Engineering, Business & Social Work", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.fh-bielefeld.de/en" },
  { name: "Münster University of Applied Sciences (FH Münster)", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://en.fh-muenster.de/" },
  { name: "Hochschule Bonn-Rhein-Sieg", type: "Public", focus: "Computer Science & Engineering", tuition: "Free (€295/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.h-brs.de/en" },
  { name: "Aachen University of Applied Sciences (FH Aachen)", type: "Public", focus: "Engineering & Aerospace", tuition: "Free (€275/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.fh-aachen.de/en/" },
  { name: "Düsseldorf University of Applied Sciences (HSD)", type: "Public", focus: "Design, Social Work & Engineering", tuition: "Free (€300/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-duesseldorf.de/en" },
  { name: "Augsburg University of Applied Sciences (HS Augsburg)", type: "Public", focus: "Engineering & Business", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-augsburg.de/en/" },
  { name: "Rosenheim Technical University of Applied Sciences", type: "Public", focus: "Engineering & Business", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.th-rosenheim.de/en/" },
  { name: "Ingolstadt University of Applied Sciences (THI)", type: "Public", focus: "Engineering & Business", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.thi.de/en/" },
  { name: "Deggendorf Institute of Technology (THD)", type: "Public", focus: "Engineering & Health Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.th-deg.de/en" },
  { name: "Weihenstephan-Triesdorf University of Applied Sciences", type: "Public", focus: "Agriculture & Life Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hswt.de/en.html" },
  { name: "Coburg University of Applied Sciences", type: "Public", focus: "Design, Engineering & Business", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-coburg.de/en/" },
  { name: "Ansbach University of Applied Sciences", type: "Public", focus: "Business & Media", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-ansbach.de/en/" },
  { name: "Kempten University of Applied Sciences", type: "Public", focus: "Engineering & Business", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-kempten.de/en/" },
  { name: "Amberg-Weiden University of Applied Sciences (OTH)", type: "Public", focus: "Engineering & Business", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.oth-aw.de/en/" },
  { name: "Landshut University of Applied Sciences", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.haw-landshut.de/en.html" },
  { name: "OTH Regensburg (Ostbayerische TH)", type: "Public", focus: "Engineering & Business", tuition: "Free (€130/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.oth-regensburg.de/en.html" },
  { name: "Ostwestfalen-Lippe University of Applied Sciences (TH OWL)", type: "Public", focus: "Engineering & Production", tuition: "Free (€310/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.th-owl.de/en/" },
  { name: "Hochschule Stralsund (HOST)", type: "Public", focus: "Engineering & Business", tuition: "Free (€377/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hochschule-stralsund.de/en/" },
  { name: "Hochschule Wismar", type: "Public", focus: "Engineering & Business", tuition: "Free (€377/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://en.hs-wismar.de/" },
  { name: "Flensburg University of Applied Sciences", type: "Public", focus: "Business & Engineering", tuition: "Free (€355/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.fh-flensburg.de/en/" },
  { name: "Lübeck University of Applied Sciences", type: "Public", focus: "Engineering & Business", tuition: "Free (€355/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.fh-luebeck.de/en/" },
  { name: "Kiel University of Applied Sciences (FH Kiel)", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€355/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.fh-kiel.de/en/" },
  { name: "Hochschule Bremen", type: "Public", focus: "Engineering & Business", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-bremen.de/en/" },
  { name: "Hannover University of Applied Sciences (HsH)", type: "Public", focus: "Engineering & Business", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-hannover.de/en/" },
  { name: "Jade University of Applied Sciences", type: "Public", focus: "Engineering & Geosciences", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.jade-hs.de/en/" },
  { name: "Osnabrück University of Applied Sciences", type: "Public", focus: "Engineering & Agriculture", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-osnabrueck.de/en/" },
  { name: "HAWK University of Applied Sciences", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€380/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hawk.de/en" },
  { name: "Erfurt University of Applied Sciences", type: "Public", focus: "Business & Social Sciences", tuition: "Free (€245/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.fh-erfurt.de/en/" },
  { name: "Jena University of Applied Sciences (EAH Jena)", type: "Public", focus: "Engineering & Business", tuition: "Free (€245/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.eah-jena.de/en/" },
  { name: "Schmalkalden University of Applied Sciences", type: "Public", focus: "Engineering & Business", tuition: "Free (€245/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-schmalkalden.de/en/" },
  { name: "Merseburg University of Applied Sciences", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-merseburg.de/en/" },
  { name: "Hochschule Harz", type: "Public", focus: "Business & Computer Science", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-harz.de/en/" },
  { name: "Hochschule Anhalt", type: "Public", focus: "Engineering & Agriculture", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.hs-anhalt.de/en.html" },
  { name: "Hochschule Magdeburg-Stendal", type: "Public", focus: "Engineering & Social Sciences", tuition: "Free (€260/sem)", intl: "IELTS 6.0+ or German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top UAS", website: "https://www.h2.de/en.html" },
  // ── Art & Music Colleges ──
  { name: "Berlin University of the Arts (UdK Berlin)", type: "Public", focus: "Fine Arts, Music & Architecture", tuition: "Free (€315/sem)", intl: "Audition/portfolio + German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Art", website: "https://www.udk-berlin.de/en/" },
  { name: "Hochschule für Musik und Theater München", type: "Public", focus: "Music & Theatre", tuition: "Free (€130/sem)", intl: "Audition + German B2", scholarships: "DAAD, music scholarships", rank: "Top Music", website: "https://www.hmtm.de/en/" },
  { name: "Hochschule für Musik Freiburg", type: "Public", focus: "Classical Music & Composition", tuition: "Free (€165/sem)", intl: "Audition + German B2", scholarships: "DAAD, music scholarships", rank: "Top Music", website: "https://www.mh-freiburg.de/en/" },
  { name: "Hochschule für Musik Detmold", type: "Public", focus: "Music Performance & Education", tuition: "Free (€310/sem)", intl: "Audition + German B2", scholarships: "DAAD, music scholarships", rank: "Top Music", website: "https://www.hfm-detmold.de/en/" },
  { name: "Hochschule für Musik Karlsruhe", type: "Public", focus: "Music Performance & Composition", tuition: "Free (€175/sem)", intl: "Audition + German B2", scholarships: "DAAD, music scholarships", rank: "Top Music", website: "https://www.hfm-karlsruhe.de/en/" },
  { name: "HfK Bremen (Hochschule für Künste)", type: "Public", focus: "Fine Arts & Music", tuition: "Free (€380/sem)", intl: "Portfolio/audition + German B2", scholarships: "DAAD, Deutschlandstipendium", rank: "Top Art", website: "https://www.hfk-bremen.de/en/" },
  // ── Private Universities ──
  { name: "WHU – Otto Beisheim School of Management", type: "Private", focus: "Business & Management", tuition: "€25,000/yr", intl: "IELTS 7.0+", scholarships: "Competitive merit awards", rank: "Top Private", website: "https://www.whu.edu/en/" },
  { name: "Jacobs University Bremen (Constructor University)", type: "Private", focus: "STEM & International Studies", tuition: "€20,000/yr", intl: "IELTS 6.5+", scholarships: "Need & merit-based up to 100%", rank: "Top Private", website: "https://www.constructor.university/" },
  { name: "Hertie School (Berlin)", type: "Private", focus: "Public Policy & Governance", tuition: "€12,000–€18,000/yr", intl: "IELTS 7.0+", scholarships: "Generous need & merit awards", rank: "Top Private", website: "https://www.hertie-school.org/en/" },
  { name: "HHL Leipzig Graduate School of Management", type: "Private", focus: "Business & Entrepreneurship", tuition: "€25,000–€35,000/yr", intl: "IELTS 6.5+", scholarships: "Merit-based scholarships", rank: "Top Private", website: "https://www.hhl.de/en/" },
  { name: "Frankfurt School of Finance & Management", type: "Private", focus: "Finance & Management", tuition: "€18,000–€32,000/yr", intl: "IELTS 6.5+", scholarships: "Merit & need-based scholarships", rank: "Top Private", website: "https://www.frankfurt-school.de/en/" },
  { name: "EBS University for Business and Law", type: "Private", focus: "Business & Law", tuition: "€15,000–€22,000/yr", intl: "IELTS 6.5+", scholarships: "Partial merit scholarships", rank: "Top Private", website: "https://www.ebs.edu/en" },
  { name: "Bucerius Law School (Hamburg)", type: "Private", focus: "Law & Business", tuition: "€10,000/yr", intl: "IELTS 7.0+", scholarships: "Merit-based scholarships", rank: "Top Private", website: "https://www.law-school.de/en/" },
  { name: "Zeppelin University (Friedrichshafen)", type: "Private", focus: "Business, Culture & Politics", tuition: "€6,500/sem", intl: "IELTS 6.5+", scholarships: "Merit-based scholarships", rank: "Top Private", website: "https://www.zu.de/en/" },
  { name: "Munich Business School", type: "Private", focus: "International Business", tuition: "€18,000–€22,000/yr", intl: "IELTS 6.5+", scholarships: "Merit scholarships available", rank: "Top Private", website: "https://www.munich-business-school.de/en/" },
  { name: "ISM – International School of Management", type: "Private", focus: "International Management", tuition: "€10,000–€15,000/yr", intl: "IELTS 6.0+", scholarships: "Merit-based scholarships", rank: "Top Private", website: "https://www.ism.de/en/" },
  { name: "ESCP Business School (Berlin campus)", type: "Private", focus: "European Business & Management", tuition: "€15,000–€30,000/yr", intl: "IELTS 6.5+", scholarships: "Merit scholarships", rank: "Top Private", website: "https://escp.eu/berlin" },
  { name: "SRH University Heidelberg", type: "Private", focus: "Business, Health & Engineering", tuition: "€8,000–€14,000/yr", intl: "IELTS 6.0+", scholarships: "SRH scholarships available", rank: "Top Private", website: "https://www.srh-university.de/en/" },
  { name: "IU International University of Applied Sciences", type: "Private", focus: "Business, IT & Psychology", tuition: "€5,000–€15,000/yr", intl: "IELTS 6.0+", scholarships: "Early-bird & merit discounts", rank: "Top Private", website: "https://www.iu.de/en/" },
  { name: "Macromedia University", type: "Private", focus: "Media, Design & Management", tuition: "€8,000–€12,000/yr", intl: "IELTS 6.0+", scholarships: "Merit scholarships available", rank: "Top Private", website: "https://www.macromedia.de/en/" },
  { name: "Code University of Applied Sciences", type: "Private", focus: "Software Engineering & Product Design", tuition: "€6,000/yr", intl: "IELTS 6.0+", scholarships: "Partial scholarships", rank: "Top Private", website: "https://code.berlin/en/" },
  { name: "Charlotte Fresenius University", type: "Private", focus: "Psychology, Media & Business", tuition: "€8,000–€14,000/yr", intl: "IELTS 6.0+", scholarships: "Merit scholarships", rank: "Top Private", website: "https://www.charlotte-fresenius-uni.de/en/" },
  { name: "BSP Business and Law School Berlin", type: "Private", focus: "Business & Law", tuition: "€7,000–€12,000/yr", intl: "IELTS 6.0+", scholarships: "Merit scholarships", rank: "Top Private", website: "https://www.bsp-business.de/en/" },
  { name: "EU Business School Germany", type: "Private", focus: "International Business", tuition: "€14,000–€18,000/yr", intl: "IELTS 6.0+", scholarships: "Merit-based awards", rank: "Top Private", website: "https://www.euruni.edu/campuses/germany/" },
  { name: "New European College (Munich)", type: "Private", focus: "Business Administration", tuition: "€9,000–€12,000/yr", intl: "IELTS 6.0+", scholarships: "Merit scholarships", rank: "Top Private", website: "https://www.neweuropeancollege.com/" },
  { name: "Touro University Berlin", type: "Private", focus: "Business, Jewish Studies & Education", tuition: "€7,000–€10,000/yr", intl: "IELTS 6.0+", scholarships: "Need-based support", rank: "Top Private", website: "https://www.touroberlin.de/en/" },
];

const FEATURES = [
  { icon: "🤖", title: "AI Mentor", desc: "Get personalised guidance on education and career paths powered by advanced AI." },
  { icon: "🎓", title: "University Gateway", desc: "Explore UK universities, entry requirements, scholarships and UCAS guidance." },
  { icon: "💼", title: "Sponsorship Jobs", desc: "Find UK employers who offer visa sponsorship across high-demand sectors." },
  { icon: "🗺️", title: "Education Pathways", desc: "Navigate your local education system with expert AI support and planning." },
  { icon: "📊", title: "Career Insights", desc: "Access salary data, industry demand forecasts and skills gap analysis." },
  { icon: "🌍", title: "Global Reach", desc: "Supporting students from 50+ countries on their journey to UK education." },
];

const FALLBACK_JOBS = [];




// ─── Global styles (outside component) ────────────────────────────────────
const S = {
  wrap: { fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh", background: "var(--color-background-tertiary)" },
  btnPrimary: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  btnOutline: { padding: "12px 28px", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  section: { maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem" },
  sectionTitle: { fontSize: "1.6rem", fontWeight: 500, margin: "0 0 0.5rem" },
  sectionSub: { color: "var(--color-text-secondary)", margin: "0 0 2rem", fontSize: "15px" },
  grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" },
  card: { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem" },
  tag: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, background: c === "purple" ? "rgba(26,63,168,0.15)" : c === "teal" ? "rgba(255,69,0,0.15)" : c === "green" ? "rgba(22,163,74,0.15)" : "rgba(26,63,168,0.1)", color: c === "purple" ? "#1A3FA8" : c === "teal" ? "#FF4500" : c === "green" ? "#16A34A" : "#1A3FA8" }),
  input: { padding: "10px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontSize: "14px", outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  footer: { borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-primary)", padding: "2rem 1.5rem", textAlign: "center" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", margin: "2rem 0" },
  statCard: { background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "1rem", textAlign: "center" },
  filterBtn: (a) => ({ padding: "6px 16px", borderRadius: "20px", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#1A3FA8" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }),
  pageBtn: (a) => ({ minWidth: "36px", height: "36px", padding: "0 10px", borderRadius: "var(--border-radius-md)", border: a ? "none" : "0.5px solid var(--color-border-secondary)", background: a ? "#1A3FA8" : "var(--color-background-primary)", color: a ? "#fff" : "var(--color-text-secondary)", fontSize: "14px", cursor: a ? "default" : "pointer", fontFamily: "inherit", fontWeight: a ? 500 : 400 }),
};

// ─── Share Button ──────────────────────────────────────────────────────────
function ShareButton({ job }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ✅ FIXED: Use job ID instead of encoding full job object
  const siteUrl = `https://mentorgramai.com/#job=${job.id}`;
  const text = `🇬🇧 UK Job with Visa Sponsorship!\n\n💼 ${job.title}\n🏢 ${job.company}\n📍 ${job.location}\n💰 ${job.salary}\n\n👉 View details: ${siteUrl}\n\n🎓 Find more at mentorgramai.com`;

  const options = [
    { label: "WhatsApp", color: "#25D366", href: `https://wa.me/?text=${encodeURIComponent(text)}`, icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
    { label: "Telegram", color: "#229ED9", href: `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(text)}`, icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
    { label: "Email", color: "#EA4335", href: `mailto:?subject=${encodeURIComponent(`Job: ${job.title} at ${job.company}`)}&body=${encodeURIComponent(text)}`, icon: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
    { label: "Copy link", color: "#1A3FA8", action: () => { navigator.clipboard.writeText(siteUrl); setOpen(false); } },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Share"
        style={{ width: "34px", height: "34px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{ position: "fixed", bottom: "auto", right: "1rem", left: "auto", top: "auto", marginTop: "8px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "6px", zIndex: 200, minWidth: "165px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}
            ref={node => { if (node && ref.current) { const btn = ref.current.getBoundingClientRect(); node.style.top = (btn.bottom + 8) + "px"; node.style.left = Math.min(btn.left, window.innerWidth - 175) + "px"; } }}>
            <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", padding: "4px 10px 6px", margin: 0, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>Share this job</p>
            {options.map(opt => opt.href ? (
              <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "var(--border-radius-md)", color: "var(--color-text-primary)", textDecoration: "none", fontSize: "14px" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={opt.color}><path d={opt.icon}/></svg>{opt.label}
              </a>
            ) : (
              <button key={opt.label} onClick={opt.action}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "var(--border-radius-md)", color: "var(--color-text-primary)", fontSize: "14px", cursor: "pointer", width: "100%", border: "none", background: "transparent", fontFamily: "inherit", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={opt.color}><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Job Detail Page ───────────────────────────────────────────────────────
function JobDetailPage({ job, onBack, onAskMentor }) {
  // ✅ FIXED: Use job ID instead of encoding full job object
  const siteUrl = `https://mentorgramai.com/#job=${job.id}`;
  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.5rem" }}>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "var(--color-text-secondary)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", marginBottom: "1.5rem", padding: 0 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        Back to jobs
      </button>
      <div style={{ ...S.card, padding: "1.75rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 500, margin: "0 0 6px" }}>{job.title}</h1>
            <p style={{ fontSize: "16px", color: "var(--color-text-secondary)", margin: "0 0 1rem" }}>{job.company}</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {job.sector && <span style={S.tag("purple")}>{job.sector}</span>}
              {job.sponsorship === true
                ? <span style={{ ...S.tag("teal") }}>✓ Visa Sponsorship</span>
                : <span style={{ display:"inline-block", padding:"3px 10px", borderRadius:"var(--border-radius-md)", fontSize:"12px", fontWeight:500, background:"var(--color-background-secondary)", color:"var(--color-text-secondary)" }}>No sponsorship info</span>
              }
            </div>
          </div>
          <ShareButton job={job} />
        </div>
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "1.25rem", paddingTop: "1.25rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
          {[["📍","Location",job.location],["💰","Salary",job.salary],["🗂️","Sector",job.sector||"General"],["🗓️","Posted",job.posted||"Recently"]].map(([icon,label,value]) => (
            <div key={label}>
              <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: "0 0 3px" }}>{icon} {label}</p>
              <p style={{ fontSize: "14px", fontWeight: 500, margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...S.card, marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem" }}>About this role</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 0.75rem" }}>
          This is a UK-based role at <strong>{job.company}</strong> in <strong>{job.location}</strong> offering visa sponsorship for eligible candidates.
        </p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
          The role is in the <strong>{job.sector || "General"}</strong> sector and eligible for a <strong>Skilled Worker visa</strong>. Click Apply for full details and requirements.
        </p>
      </div>
      <div style={{ background: "rgba(26,63,168,0.1)", border: "0.5px solid rgba(26,63,168,0.2)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.75rem", color: "var(--color-text-primary)" }}>🛂 Visa sponsorship info</h2>
        {["This employer is registered as a UK visa sponsor","You may be eligible for a Skilled Worker or Health & Care visa","Minimum salary thresholds apply (usually £26,200+)","Your employer will assign a Certificate of Sponsorship (CoS)"].map((item, i) => (
          <p key={i} style={{ fontSize: "14px", color: "var(--color-text-primary)", margin: "0 0 4px", display: "flex", gap: "8px" }}><span>✓</span><span>{item}</span></p>
        ))}
      </div>
      <div style={{ ...S.card, marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 500, margin: "0 0 0.5rem" }}>💬 Need help applying?</h2>
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", margin: "0 0 1rem", lineHeight: 1.6 }}>Ask our AI Mentor about this role, the skills needed, and how visa sponsorship works.</p>
        <button style={{ ...S.btnOutline, padding: "9px 20px", fontSize: "14px" }}
          onClick={() => onAskMentor(`I want to apply for ${job.title} at ${job.company} in ${job.location}. What skills do I need and how does visa sponsorship work?`)}>
          Ask AI Mentor ↗
        </button>
      </div>
      <div style={{ background: "rgba(245,158,11,0.08)", border: "0.5px solid rgba(245,158,11,0.3)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.6 }}>
          ⚠️ <strong style={{ color: "var(--color-text-primary)" }}>Job listings can close at any time.</strong> If the link shows "page not found", the role has been filled. Try searching for similar roles on Reed or Adzuna directly.
        </p>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...S.btnPrimary, textDecoration: "none" }}
          >Apply for this job ↗</a>
        )}
        {job.source === "Reed" && (
          <a
            href={"https://www.reed.co.uk/jobs/" + encodeURIComponent(job.title || "").replace(/%20/g, "-").toLowerCase() + "-jobs?keywords=" + encodeURIComponent(job.title || "")}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...S.btnOutline, textDecoration: "none", fontSize: "14px" }}
          >Search similar on Reed ↗</a>
        )}
        {job.source === "Adzuna" && (
          <a
            href={"https://www.adzuna.co.uk/search?q=" + encodeURIComponent(job.title || "") + "&w=United+Kingdom"}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...S.btnOutline, textDecoration: "none", fontSize: "14px" }}
          >Search similar on Adzuna ↗</a>
        )}
        <button style={S.btnOutline} onClick={onBack}>← Back to jobs</button>
      </div>
    </div>
  );
}

// ─── Jobs Page ─────────────────────────────────────────────────────────────
function JobsPage({ allJobs, jobsLoading, updatedAt, onFetchJobs, onSelectJob, profileFilter, onClearProfileFilter }) {
  const [sector, setSector] = useState("All");
  const [visaType, setVisaType] = useState("All Jobs");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [employerType, setEmployerType] = useState("All");
  const [titleQuery, setTitleQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [page, setPage] = useState(1);
  const [clickedJob, setClickedJob] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    if (profileFilter) {
      if (profileFilter.sectors?.length > 0) setSector(profileFilter.sectors[0]);
      if (profileFilter.location) setLocationQuery(profileFilter.location);
      if (profileFilter.visaStatus === "I need visa sponsorship") setVisaType("Visa Sponsorship");
    }
  }, [profileFilter]);
  const searchTimer = useRef(null);

  useEffect(() => { setPage(1); }, [sector, visaType, titleQuery, locationQuery]);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [page]);

  function handleTitleChange(val) {
    setTitleQuery(val);
    clearTimeout(searchTimer.current);
    if (val.length >= 3) {
      searchTimer.current = setTimeout(() => onFetchJobs(val, locationQuery), 600);
    }
  }

  function handleLocationChange(val) {
    setLocationQuery(val);
    clearTimeout(searchTimer.current);
    if (val.length === 0) {
      searchTimer.current = setTimeout(() => onFetchJobs(titleQuery, ""), 300);
    } else if (val.length >= 2) {
      searchTimer.current = setTimeout(() => onFetchJobs(titleQuery, val), 600);
    }
  }

  const filtered = allJobs.filter(j => {
    const matchSector = sector === "All" || j.sector === sector;
    const matchVisa = visaType === "All Jobs"
      || (visaType === "✓ Visa Sponsorship" && j.sponsorship === true)
      || (visaType === "No Info" && j.sponsorship !== true);
    const src = (j.source || "").toLowerCase();
    const sf = sourceFilter.toLowerCase();
    const matchSource = sourceFilter === "All"
      || src === sf
      || (sf === "jobs.ac.uk" && src.includes("jobs.ac"))
      || (sf === "guardian jobs" && src.includes("guardian"))
      || (sf === "indeed" && (src === "indeed" || src === "fallback"))
      || src.includes(sf);
    const empText = `${j.title} ${j.company} ${j.source || ""}`.toLowerCase();
    const matchEmployer = employerType === "All"
      || (employerType === "NHS"        && (empText.includes("nhs") || empText.includes("national health") || empText.includes(" trust") || empText.includes("hospital") || empText.includes("clinical")))
      || (employerType === "University" && (empText.includes("universit") || empText.includes("college") || empText.includes("institute") || empText.includes("academy") || empText.includes("research") || empText.includes("jobs.ac.uk") || j.source === "jobs.ac.uk"))
      || (employerType === "Council"    && (empText.includes("council") || empText.includes("local authority") || empText.includes("borough") || empText.includes("county") || empText.includes("district") || empText.includes("city of") || empText.includes("metropolitan") || j.source === "LG Jobs" || j.source === "Civil Service"))
      || (employerType === "Private"    && !(empText.includes("nhs") || empText.includes("national health") || empText.includes(" trust") || empText.includes("hospital") || empText.includes("clinical") || empText.includes("universit") || empText.includes("college") || empText.includes("institute") || empText.includes("research") || empText.includes("jobs.ac.uk") || j.source === "jobs.ac.uk" || empText.includes("council") || empText.includes("local authority") || empText.includes("borough") || empText.includes("county") || empText.includes("district") || j.source === "LG Jobs" || j.source === "Civil Service"));
    const q = titleQuery.toLowerCase().trim();
    const matchTitle = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    const loc = locationQuery.toLowerCase().trim();
    const matchLoc = !loc || j.location.toLowerCase().includes(loc);
    return matchSector && matchVisa && matchSource && matchEmployer && matchTitle && matchLoc;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / JOBS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * JOBS_PER_PAGE, safePage * JOBS_PER_PAGE);

  function getPageNums() {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safePage <= 3) return [1, 2, 3, 4, 5];
    if (safePage >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [safePage - 2, safePage - 1, safePage, safePage + 1, safePage + 2];
  }

  return (
    <div style={S.section}>
      <div ref={topRef}>
        <h2 style={S.sectionTitle}>Sponsorship jobs</h2>
        <p style={{ ...S.sectionSub, marginBottom: "1.5rem" }}>Search UK jobs with visa sponsorship — updated live.</p>
      </div>

      {/* Search box */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: "160px", position: "relative", display: "flex", alignItems: "center" }}>
            <input style={{ ...S.input, paddingRight: titleQuery ? "32px" : "12px" }} placeholder="🔍 Job title or keywords..."
              value={titleQuery} onChange={e => handleTitleChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onFetchJobs(titleQuery, locationQuery)} />
            {titleQuery && (
              <button onClick={() => handleTitleChange("")}
                style={{ position: "absolute", right: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: "18px", lineHeight: 1, padding: "0 2px", display: "flex", alignItems: "center" }}>×</button>
            )}
          </div>
          <input style={{ ...S.input, flex: 1, minWidth: "120px" }} placeholder="📍 Location..."
            value={locationQuery} onChange={e => handleLocationChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onFetchJobs(titleQuery, locationQuery)} />
          <button style={{ ...S.btnPrimary, padding: "10px 20px", fontSize: "14px", whiteSpace: "nowrap", opacity: jobsLoading ? 0.7 : 1 }}
            onClick={() => { clearTimeout(searchTimer.current); onFetchJobs(titleQuery, locationQuery); }} disabled={jobsLoading}>
            {jobsLoading ? "Searching..." : "Search"}
          </button>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", marginTop: "10px" }}>
          <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>🔍 Try:</span>
          {["Software Engineer", "Data Scientist", "NHS Nurse", "Financial Analyst", "Civil Engineer", "Marketing Manager", "Graphic Designer", "IT Technician"].map(q => (
            <button key={q}
              onClick={() => { setTitleQuery(q); onFetchJobs(q, locationQuery); }}
              style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 400,
                border: "0.5px dashed var(--color-border-secondary)",
                background: "transparent",
                color: "var(--color-text-secondary)" }}>
              {q}
            </button>
          ))}
        </div>
        {updatedAt && <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "8px 0 0" }}>Updated: {new Date(updatedAt).toLocaleTimeString()}</p>}
      </div>

      {/* Profile filter banner */}
      {profileFilter && (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "linear-gradient(135deg, rgba(26,63,168,0.08), rgba(29,158,117,0.05))", border: "0.5px solid rgba(26,63,168,0.2)", borderRadius: "var(--border-radius-md)", marginBottom: "1rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "14px" }}>🎯</span>
          <p style={{ fontSize: "13px", margin: 0, flex: 1 }}>
            <strong>Filtered by your profile</strong>
            {profileFilter.sectors?.length > 0 && ` · ${profileFilter.sectors.join(", ")}`}
            {profileFilter.location && ` · ${profileFilter.location}`}
            {profileFilter.visaStatus === "I need visa sponsorship" && " · Visa Sponsorship only"}
          </p>
          <button onClick={() => { onClearProfileFilter(); setSector("All"); setLocationQuery(""); setVisaType("All Jobs"); }}
            style={{ padding: "5px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-secondary)" }}>
            Clear ✕
          </button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
        {/* Sector dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>Sector:</span>
          <select
            value={sector}
            onChange={e => { setSector(e.target.value); setPage(1); }}
            style={{ padding: "6px 12px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: sector !== "All" ? "#1A3FA8" : "var(--color-background-primary)", color: sector !== "All" ? "#fff" : "var(--color-text-secondary)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", outline: "none" }}>
            {SECTORS.map(s => <option key={s} value={s} style={{ background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}>{s}</option>)}
          </select>
        </div>
        {/* Visa filter */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>Visa:</span>
          {VISA_TYPES.map(v => (
            <button key={v} style={{ ...S.filterBtn(visaType === v), fontSize: "12px", padding: "5px 12px", background: visaType === v ? (v === "✓ Visa Sponsorship" ? "#16A34A" : "#1A3FA8") : "var(--color-background-primary)" }}
              onClick={() => { setVisaType(v); setPage(1); }}>{v}</button>
          ))}
        </div>
        {/* Clear all filters */}
        {(sector !== "All" || visaType !== "All Jobs" || employerType !== "All" || titleQuery || locationQuery) && (
          <button
            onClick={() => { setSector("All"); setVisaType("All Jobs"); setEmployerType("All"); setTitleQuery(""); setLocationQuery(""); setPage(1); onFetchJobs("", ""); }}
            style={{ padding: "5px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
            ✕ Clear all filters
          </button>
        )}
      </div>

      {/* Employer type filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500 }}>Employer:</span>
        {[
          { key: "All",        label: "All" },
          { key: "NHS",        label: "🏥 NHS" },
          { key: "University", label: "🎓 University" },
          { key: "Council",    label: "🏛 Council" },
          { key: "Private",    label: "🏢 Private" },
        ].map(({ key, label }) => {
          const active = employerType === key;
          const count = key === "All" ? null : allJobs.filter(j => {
            const t = `${j.title} ${j.company} ${j.source || ""}`.toLowerCase();
            if (key === "NHS")        return t.includes("nhs") || t.includes("national health") || t.includes(" trust") || t.includes("hospital") || t.includes("clinical");
            if (key === "University") return t.includes("universit") || t.includes("college") || t.includes("institute") || t.includes("research") || t.includes("jobs.ac.uk") || j.source === "jobs.ac.uk";
            if (key === "Council")    return t.includes("council") || t.includes("borough") || t.includes("local authority") || t.includes("district") || t.includes("metropolitan");
            if (key === "Private")    return !(t.includes("nhs") || t.includes("national health") || t.includes(" trust") || t.includes("hospital") || t.includes("universit") || t.includes("college") || t.includes("council") || t.includes("borough") || j.source === "jobs.ac.uk" || j.source === "LG Jobs" || j.source === "Civil Service");
            return false;
          }).length;
          return (
            <button key={key}
              style={{ padding: "5px 12px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500,
                border: `0.5px solid ${active ? "#1A3FA8" : "var(--color-border-tertiary)"}`,
                background: active ? "#1A3FA8" : "var(--color-background-primary)",
                color: active ? "#fff" : "var(--color-text-secondary)",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
              onClick={() => { setEmployerType(key); setPage(1); }}>
              {label}{count !== null && count > 0 ? <span style={{ opacity: 0.7, fontSize: "11px", marginLeft: "4px" }}>({count})</span> : null}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1.25rem" }}>
        {jobsLoading
          ? `🔍 Refreshing jobs... (${allJobs.length > 0 ? allJobs.length.toLocaleString() + " total" : "loading"})`
          : <>
              Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> jobs
            </>
        }
        {!jobsLoading && titleQuery && ` · matching "${titleQuery}"`}
        {!jobsLoading && locationQuery && ` · in "${locationQuery}"`}
        {!jobsLoading && sector !== "All" && ` · ${sector}`}
      </p>

      {/* Loading skeletons */}
      {jobsLoading && (
        <div style={S.grid2}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ ...S.card, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ height: "16px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "70%" }} />
              <div style={{ height: "12px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "40%" }} />
              <div style={{ height: "12px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "55%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                <div style={{ height: "14px", background: "var(--color-background-secondary)", borderRadius: "4px", width: "30%" }} />
                <div style={{ height: "32px", width: "70px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job cards */}
      {!jobsLoading && paginated.length > 0 && (
        <div style={S.grid2}>
          {paginated.map((j, i) => (
            <div key={i}
              className={clickedJob === i ? "job-card-click" : ""}
              style={{ ...S.card, display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s", minHeight: "190px" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,63,168,0.12)"; e.currentTarget.style.borderColor = "rgba(26,63,168,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; }}
              onClick={() => { setClickedJob(i); setTimeout(() => { onSelectJob(j); setClickedJob(null); }, 320); }}>

              {/* Title + sponsorship badge */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, margin: "0 0 3px", fontSize: "14px", color: "var(--color-text-primary)", lineHeight: 1.4, wordBreak: "break-word" }}>{j.title}</p>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.company}</p>
                </div>
                <span style={{ flexShrink: 0, padding: "3px 8px", borderRadius: "var(--border-radius-md)", fontSize: "11px", fontWeight: 500, whiteSpace: "nowrap",
                  background: j.sponsorship === true ? "rgba(22,163,74,0.15)" : "var(--color-background-secondary)",
                  color: j.sponsorship === true ? "#16A34A" : "var(--color-text-secondary)" }}>
                  {j.sponsorship === true ? "✓ Sponsorship" : "No info"}
                </span>
              </div>

              {/* Tags + location + posted date */}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", alignItems: "center", marginBottom: "8px" }}>
                {j.sector && <span style={{ padding: "2px 7px", borderRadius: "var(--border-radius-md)", fontSize: "11px", fontWeight: 500, background: "rgba(26,63,168,0.12)", color: "#1A3FA8" }}>{j.sector}</span>}
                <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>📍 {j.location}</span>
                {(() => {
                  const raw = j.posted || "";
                  const isInvalid = !raw || raw.toLowerCase().includes("invalid") || raw.includes("NaN");
                  const label = isInvalid ? "Recently" : raw;
                  return (
                    <span style={{
                      fontSize: "11px",
                      color: "var(--color-text-secondary)",
                      background: "var(--color-background-secondary)",
                      padding: "2px 7px",
                      borderRadius: "var(--border-radius-md)",
                      border: "0.5px solid var(--color-border-tertiary)",
                    }}>
                      📅 {label}
                    </span>
                  );
                })()}
              </div>

              {/* Salary + buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginTop: "auto" }}>
                <p style={{ fontWeight: 600, color: "var(--color-text-primary)", margin: 0, fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.salary || "Competitive"}</p>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <ShareButton job={j} />
                  <button
                    onClick={e => { e.stopPropagation(); setClickedJob(i); setTimeout(() => { onSelectJob(j); setClickedJob(null); }, 320); }}
                    style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", fontSize: "12px", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                    View ↗
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!jobsLoading && paginated.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", margin: "0 0 1rem" }}>🔍</p>
          <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>No jobs found</p>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1.25rem" }}>Try searching for a specific role above</p>
          <button style={S.btnPrimary} onClick={() => { setTitleQuery(""); setLocationQuery(""); setSector("All"); setVisaType("All Jobs"); setSourceFilter("All"); setEmployerType("All"); setPage(1); onFetchJobs("", ""); }}>Show all jobs</button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !jobsLoading && (
        <>
          <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", marginTop: "2rem", flexWrap: "wrap" }}>
            {safePage > 3 && totalPages > 5 && <><button style={S.pageBtn(false)} onClick={() => setPage(1)}>1</button><span style={{ color: "var(--color-text-secondary)" }}>…</span></>}
            {getPageNums().map(p => <button key={p} style={S.pageBtn(p === safePage)} onClick={() => setPage(p)}>{p}</button>)}
            {safePage < totalPages - 2 && totalPages > 5 && <><span style={{ color: "var(--color-text-secondary)" }}>…</span><button style={S.pageBtn(false)} onClick={() => setPage(totalPages)}>{totalPages}</button></>}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px" }}>
            <button style={{ ...S.btnOutline, padding: "8px 20px", fontSize: "13px", opacity: safePage === 1 ? 0.4 : 1 }} onClick={() => safePage > 1 && setPage(p => p - 1)} disabled={safePage === 1}>← Previous</button>
            <button style={{ ...S.btnPrimary, padding: "8px 20px", fontSize: "13px", opacity: safePage === totalPages ? 0.4 : 1 }} onClick={() => safePage < totalPages && setPage(p => p + 1)} disabled={safePage === totalPages}>Next →</button>
          </div>
          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--color-text-secondary)", marginTop: "0.75rem" }}>Page {safePage} of {totalPages} · {filtered.length} total</p>
        </>
      )}
    </div>
  );
}

// ─── Contact Page ─────────────────────────────────────────────────────────
function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit() {
    if (!name || !email || !subject || !message) {
      alert("Please fill in all fields.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message })
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setName(""); setEmail(""); setSubject(""); setMessage("");
      } else {
        throw new Error("Failed");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div style={S.section}>
      <div style={{ maxWidth: "540px", margin: "0 auto" }}>
        <h2 style={S.sectionTitle}>Get in touch</h2>
        <p style={S.sectionSub}>Have questions about Mentorgram? We'd love to hear from you.</p>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem", position: "relative", overflow: "hidden" }}>
            <style>{`
              @keyframes popIn { 0% { transform: scale(0) rotate(-10deg); opacity: 0; } 60% { transform: scale(1.2) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
              @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(220px) rotate(720deg); opacity: 0; } }
              .success-icon { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; display: inline-block; }
              .success-title { animation: fadeSlideUp 0.5s ease 0.3s both; }
              .success-sub { animation: fadeSlideUp 0.5s ease 0.45s both; }
              .success-btn { animation: fadeSlideUp 0.5s ease 0.6s both; }
              .confetti-piece { position: absolute; width: 8px; height: 8px; border-radius: 2px; animation: confettiFall linear forwards; }
            `}</style>
            {[
              { left: "10%", delay: "0s",   color: "#1A3FA8", size: "8px",  duration: "1.2s" },
              { left: "20%", delay: "0.1s", color: "#FF4500", size: "6px",  duration: "1.5s" },
              { left: "30%", delay: "0.2s", color: "#F7C75B", size: "10px", duration: "1.1s" },
              { left: "45%", delay: "0s",   color: "#E24B4A", size: "7px",  duration: "1.4s" },
              { left: "55%", delay: "0.15s",color: "#1A3FA8", size: "9px",  duration: "1.3s" },
              { left: "65%", delay: "0.05s",color: "#FF4500", size: "6px",  duration: "1.6s" },
              { left: "75%", delay: "0.2s", color: "#F7C75B", size: "8px",  duration: "1.2s" },
              { left: "85%", delay: "0.1s", color: "#E24B4A", size: "7px",  duration: "1.5s" },
              { left: "50%", delay: "0.3s", color: "#1A3FA8", size: "5px",  duration: "1.1s" },
              { left: "35%", delay: "0.25s",color: "#FF4500", size: "9px",  duration: "1.4s" },
            ].map((c, i) => (
              <div key={i} className="confetti-piece" style={{ left: c.left, top: "-10px", background: c.color, width: c.size, height: c.size, animationDuration: c.duration, animationDelay: c.delay }} />
            ))}
            <div className="success-icon" style={{ fontSize: "64px", marginBottom: "1rem", display: "block" }}>📨</div>
            <h3 className="success-title" style={{ fontSize: "1.4rem", fontWeight: 500, margin: "0 0 0.5rem", color: "var(--color-text-primary)" }}>Message sent! 🎉</h3>
            <p className="success-sub" style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: "0 0 1.5rem", lineHeight: 1.6 }}>
              Thanks <strong>{name}</strong>! We'll get back to you at <strong>{email}</strong> shortly.
            </p>
            <button className="success-btn" style={{ ...S.btnOutline, padding: "9px 24px", fontSize: "14px" }} onClick={() => setStatus("idle")}>
              Send another message
            </button>
          </div>
        ) : (
          <div style={S.card}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <input style={{ ...S.input, flex: 1, minWidth: "140px" }} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                <input style={{ ...S.input, flex: 1, minWidth: "140px" }} type="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <input style={S.input} placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
              <textarea style={{ ...S.input, height: "120px", resize: "vertical" }} placeholder="Your message..." value={message} onChange={e => setMessage(e.target.value)} />
              <button style={{ ...S.btnPrimary, opacity: status === "sending" ? 0.7 : 1 }} onClick={handleSubmit} disabled={status === "sending"}>
                {status === "sending" ? "Sending..." : "Send message"}
              </button>
              {status === "error" && (
                <p style={{ color: "#E24B4A", fontSize: "13px", margin: 0 }}>
                  Something went wrong. Email us directly at{" "}
                  <a href="mailto:info@mentorgramai.com" style={{ color: "#E24B4A" }}>info@mentorgramai.com</a>
                </p>
              )}
            </div>
          </div>
        )}

        <div style={{ ...S.card, marginTop: "1rem" }}>
          <p style={{ fontWeight: 500, margin: "0 0 10px" }}>Contact details</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
            <a href="mailto:info@mentorgramai.com" style={{ color: "var(--color-text-secondary)", textDecoration: "none" }}>📧 info@mentorgramai.com</a>
            <span>🌐 mentorgramai.com</span>
            <span>📍 United Kingdom</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Guide Page ───────────────────────────────────────────────────────────
function GuidePage({ navTo }) {
  const [emailVal, setEmailVal] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState(false);

  function handleSubmit() {
    if (!emailVal.trim() || !emailVal.includes("@")) { setErr(true); return; }
    setErr(false);
    fetch("/api/send-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, consent: true, source: "guide-page" }),
    }).catch(() => {});
    setDone(true);
  }

  const chapters = [
    { n: "1", title: "How UK Sponsorship Works", desc: "Skilled Worker visa explained — points, salary thresholds, CoS process" },
    { n: "2", title: "Where to Find Sponsored Jobs", desc: "7 best sources including GOV.UK register and Mentorgram's free jobs board" },
    { n: "3", title: "CV & Cover Letter Formula", desc: "UK CV format, how to mention sponsorship professionally, template phrases" },
    { n: "4", title: "Interview & Visa Timeline", desc: "What to expect, questions to ask, and how long the full process takes" },
    { n: "5", title: "5 Costly Mistakes to Avoid", desc: "The most common errors that waste months of applications" },
    { n: "✓", title: "Your 7-Step Action Plan", desc: "A concrete plan to start your sponsored job search today" },
  ];

  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(160deg, #0d2478 0%, #1a3fa8 50%, #0f1535 100%)", padding: "60px 20px 80px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "inline-block", background: "rgba(255,69,0,0.2)", color: "#ff6b35", border: "1px solid rgba(255,69,0,0.3)", padding: "6px 16px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "20px" }}>
          🎁 Free Download
        </div>
        <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 800, lineHeight: 1.15, margin: "0 0 16px", color: "#fff", letterSpacing: "-0.02em" }}>
          How to Land a<br /><span style={{ color: "#FF4500" }}>UK Visa-Sponsored Role</span>
        </h1>
        <p style={{ fontSize: "16px", color: "#94a3c8", maxWidth: "520px", margin: "0 auto 36px", lineHeight: 1.7 }}>
          The step-by-step guide to finding, applying and getting sponsored to work in the UK — completely free.
        </p>
        <div style={{ background: "#fff", color: "#1a1a2e", borderRadius: "20px", padding: "32px 28px", maxWidth: "440px", margin: "0 auto", boxShadow: "0 32px 80px rgba(0,0,0,0.4)" }}>
          {!done ? (
            <>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1A3FA8", margin: "0 0 6px" }}>Get Your Free Guide</h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>Enter your email and download instantly — no spam, ever.</p>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email address</label>
              <input
                type="email"
                value={emailVal}
                onChange={e => { setEmailVal(e.target.value); setErr(false); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="you@email.com"
                style={{ width: "100%", padding: "12px 14px", border: err ? "1.5px solid #ef4444" : "1.5px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box", fontFamily: "inherit", color: "#1a1a2e" }}
              />
              {err && <p style={{ color: "#ef4444", fontSize: "12px", margin: "-8px 0 10px" }}>Please enter a valid email address</p>}
              <button onClick={handleSubmit} style={{ width: "100%", padding: "13px", background: "#1A3FA8", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Send Me the Free Guide →
              </button>
              <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginTop: "10px" }}>🔒 No spam. Unsubscribe anytime.</p>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#16A34A", marginBottom: "8px" }}>Your guide is ready!</h3>
              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", lineHeight: 1.6 }}>Click below to download your free copy.</p>
              <a href="/sponsorship-guide.pdf" download
                style={{ display: "inline-block", padding: "12px 28px", background: "linear-gradient(135deg, #1A3FA8, #FF4500)", color: "#fff", borderRadius: "10px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}>
                ⬇ Download Free Guide
              </a>
              <p style={{ marginTop: "16px", fontSize: "12px", color: "#94a3b8" }}>
                Also search 500+ live sponsored jobs on{" "}
                <button onClick={() => navTo("Sponsorship Jobs")} style={{ background: "none", border: "none", color: "#1A3FA8", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: 600, padding: 0, textDecoration: "underline" }}>
                  Mentorgram Jobs
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: "60px 20px", maxWidth: "700px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 700, textAlign: "center", margin: "0 0 8px" }}>What's Inside the Guide</h2>
        <p style={{ textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "36px" }}>8 pages of actionable, no-fluff advice</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {chapters.map(c => (
            <div key={c.n} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "18px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "linear-gradient(135deg, #1A3FA8, #0d2478)", color: "#fff", fontWeight: 800, fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{c.n}</div>
              <div>
                <p style={{ fontWeight: 600, fontSize: "14px", margin: "0 0 3px", color: "var(--color-text-primary)" }}>{c.title}</p>
                <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: "#1A3FA8", padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#b0c4f8", marginBottom: "4px" }}>While you're here</p>
        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Search 500+ Live Visa-Sponsored Jobs</h3>
        <button onClick={() => navTo("Sponsorship Jobs")}
          style={{ padding: "12px 28px", background: "#FF4500", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Browse Jobs →
        </button>
      </div>
    </div>
  );
}

// ─── Universities Page ─────────────────────────────────────────────────────
function UniversitiesPage({ setChatInput, navTo }) {
  const [country, setCountry] = useState("UK");
  const [deFilter, setDeFilter] = useState("All");
  const [deSearch, setDeSearch] = useState("");
  const [dePage, setDePage] = useState(1);
  const DE_PER_PAGE = 24;

  const publicCount  = GERMAN_UNIVERSITIES.filter(u => u.type === "Public").length;
  const privateCount = GERMAN_UNIVERSITIES.filter(u => u.type === "Private").length;

  const filteredGerman = GERMAN_UNIVERSITIES.filter(u => {
    const matchType = deFilter === "All" || u.type === deFilter;
    const q = deSearch.toLowerCase().trim();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || (u.focus || "").toLowerCase().includes(q);
    return matchType && matchSearch;
  });

  const totalDePages = Math.max(1, Math.ceil(filteredGerman.length / DE_PER_PAGE));
  const safePage = Math.min(dePage, totalDePages);
  const paginatedGerman = filteredGerman.slice((safePage - 1) * DE_PER_PAGE, safePage * DE_PER_PAGE);

  useEffect(() => { setDePage(1); }, [deFilter, deSearch]);

  const tabBtnStyle = (active, accent) => ({
    padding: "8px 20px",
    borderRadius: "var(--border-radius-md)",
    border: "none",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    background: active ? accent : "transparent",
    color: active ? "#fff" : "var(--color-text-secondary)",
    boxShadow: active ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
    transition: "all 0.18s",
  });

  const filterPillStyle = (active) => ({
    padding: "5px 14px",
    borderRadius: "var(--border-radius-md)",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    border: active ? "0.5px solid #16A34A" : "0.5px solid var(--color-border-tertiary)",
    background: active ? "#16A34A" : "var(--color-background-primary)",
    color: active ? "#fff" : "var(--color-text-secondary)",
  });

  const cardBtnStyle = (isPrivate) => ({
    flex: 1,
    padding: "7px 10px",
    borderRadius: "var(--border-radius-md)",
    fontSize: "12px",
    fontWeight: 500,
    textAlign: "center",
    cursor: "pointer",
    fontFamily: "inherit",
    border: isPrivate ? "0.5px solid rgba(245,158,11,0.3)" : "0.5px solid rgba(22,163,74,0.3)",
    color: isPrivate ? "#D97706" : "#16A34A",
    background: "transparent",
  });

  return (
    <div style={S.section}>
      <h2 style={S.sectionTitle}>Universities</h2>
      <p style={{ ...S.sectionSub, marginBottom: "1.5rem" }}>Explore top universities, entry requirements and scholarships.</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "2rem", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "5px", width: "fit-content" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setCountry(t.key)}
            style={{ padding: "8px 20px", borderRadius: "var(--border-radius-md)", border: "none", fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
              background: country === t.key ? t.accent : "transparent",
              color: country === t.key ? "#fff" : "var(--color-text-secondary)",
              boxShadow: country === t.key ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── UK tab ── */}
      {country === "UK" && (
        <>
          <p style={{ ...S.sectionSub, marginTop: "-0.5rem" }}>Top UK universities ranked by reputation, research output and student experience.</p>
          <div style={S.grid2}>
            {UK_UNIVERSITIES.map(u => (
              <div key={u.name} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <p style={{ fontWeight: 500, margin: 0, fontSize: "15px" }}>{u.name}</p>
                  <span style={S.tag("purple")}>{u.rank}</span>
                </div>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: "0 0 10px" }}>{u.focus}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[["UK entry", u.entry], ["International", u.intl], ["Scholarships", u.scholarships]].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--color-text-secondary)" }}>{l}</span>
                      <span style={l === "Scholarships" ? { color: "#1A3FA8" } : {}}>{v}</span>
                    </div>
                  ))}
                </div>
                <button style={{ marginTop: "12px", padding: "8px 16px", fontSize: "13px", width: "100%", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", cursor: "pointer", fontFamily: "inherit" }}
                  onClick={() => { setChatInput("Tell me more about " + u.name + " — courses, tips and scholarships"); navTo("AI Mentor"); }}>
                  Ask AI Mentor ↗
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Germany tab ── */}
      {country === "Germany" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <p style={{ ...S.sectionSub, margin: 0 }}>World-class education — mostly tuition-free for international students.</p>
            <span style={{ ...S.tag("green"), fontSize: "11px", flexShrink: 0 }}>Mostly free</span>
          </div>

          {/* Key facts banner */}
          <div style={{ background: "rgba(22,163,74,0.06)", border: "0.5px solid rgba(22,163,74,0.2)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              { icon: "💶", label: "Tuition",     value: "Free at public unis (small semester fee)" },
              { icon: "🗣️", label: "Language",    value: "English & German-taught programmes" },
              { icon: "📋", label: "Application", value: "Uni-Assist or direct university portal" },
              { icon: "🛂", label: "Visa",        value: "Student visa required for non-EU" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", gap: "8px", alignItems: "flex-start", minWidth: "200px" }}>
                <span style={{ fontSize: "18px" }}>{f.icon}</span>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--color-text-secondary)", margin: "0 0 2px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>{f.label}</p>
                  <p style={{ fontSize: "13px", margin: 0, fontWeight: 500 }}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter row */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search input */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px", display: "flex", alignItems: "center" }}>
              <input
                style={{ ...S.input, paddingRight: deSearch ? "32px" : "12px" }}
                placeholder="🔍 Search universities..."
                value={deSearch}
                onChange={e => setDeSearch(e.target.value)}
              />
              {deSearch && (
                <button onClick={() => setDeSearch("")}
                  style={{ position: "absolute", right: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: "18px", lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>

            {/* Public / Private filter pills */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>Type:</span>
              {[
                { key: "All",     label: "All",       count: GERMAN_UNIVERSITIES.length },
                { key: "Public",  label: "🏛 Public",  count: publicCount },
                { key: "Private", label: "🏢 Private", count: privateCount },
              ].map(({ key, label, count }) => {
                const active = deFilter === key;
                return (
                  <button key={key} onClick={() => setDeFilter(key)}
                    style={{ padding: "5px 14px", borderRadius: "var(--border-radius-md)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      border: `0.5px solid ${active ? "#16A34A" : "var(--color-border-tertiary)"}`,
                      background: active ? "#16A34A" : "var(--color-background-primary)",
                      color: active ? "#fff" : "var(--color-text-secondary)",
                    }}>
                    {label}{count > 0 && <span style={{ opacity: 0.75, fontSize: "11px", marginLeft: "4px" }}>({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context hints */}
          {deFilter === "Private" && (
            <p style={{ fontSize: "12px", color: "#D97706", marginBottom: "0.75rem" }}>💡 Private universities charge tuition but often offer generous scholarships</p>
          )}
          {deFilter === "Public" && (
            <p style={{ fontSize: "12px", color: "#16A34A", marginBottom: "0.75rem" }}>✓ Public universities are mostly free for all students</p>
          )}

          {/* Results count */}
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
            Showing <strong>{paginatedGerman.length}</strong> of <strong>{filteredGerman.length}</strong> universities
            {deSearch && ` · matching "${deSearch}"`}
            {deFilter !== "All" && ` · ${deFilter} only`}
          </p>

          {/* University cards */}
          <div style={S.grid2}>
              {paginatedGerman.map(u => (
                <div key={u.name} style={{ ...S.card, borderColor: u.type === "Private" ? "rgba(245,158,11,0.25)" : "var(--color-border-tertiary)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "8px" }}>
                      <p style={{ fontWeight: 500, margin: 0, fontSize: "14px", flex: 1, lineHeight: 1.4 }}>{u.name}</p>
                      {u.rank && <span style={S.tag(u.type === "Private" ? "teal" : "green")}>{u.rank}</span>}
                    </div>

                    {/* Type badge */}
                    <span style={{ display: "inline-block", marginBottom: "8px", padding: "2px 8px", borderRadius: "var(--border-radius-md)", fontSize: "11px", fontWeight: 600,
                      background: u.type === "Private" ? "rgba(245,158,11,0.12)" : "rgba(22,163,74,0.1)",
                      color: u.type === "Private" ? "#D97706" : "#16A34A",
                    }}>
                      {u.type === "Private" ? "🏢 Private" : "🏛 Public"}
                    </span>

                    <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", margin: "0 0 8px" }}>{u.focus}</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", gap: "8px" }}>
                        <span style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>Tuition</span>
                        <span style={{ textAlign: "right", color: u.type === "Public" ? "#16A34A" : "#D97706", fontWeight: 500 }}>{u.tuition}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", gap: "8px" }}>
                        <span style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>International</span>
                        <span style={{ textAlign: "right" }}>{u.intl}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", gap: "8px" }}>
                        <span style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>Scholarships</span>
                        <span style={{ textAlign: "right", color: "#16A34A" }}>{u.scholarships}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
                    {u.website && (
                      <a href={u.website} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: "7px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, textAlign: "center", textDecoration: "none",
                          border: `0.5px solid ${u.type === "Private" ? "rgba(245,158,11,0.3)" : "rgba(22,163,74,0.3)"}`,
                          color: u.type === "Private" ? "#D97706" : "#16A34A",
                          background: "transparent",
                        }}>
                        Visit website ↗
                      </a>
                    )}
                    <button style={{ flex: 1, padding: "7px 10px", borderRadius: "var(--border-radius-md)", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", border: u.type === "Private" ? "0.5px solid rgba(245,158,11,0.3)" : "0.5px solid rgba(22,163,74,0.3)", color: u.type === "Private" ? "#D97706" : "#16A34A", background: "transparent" }}
                      onClick={() => { setChatInput("Tell me more about " + u.name + " in Germany — English programmes, application and scholarships"); navTo("AI Mentor"); }}>
                      Ask AI Mentor ↗
                    </button>
                  </div>
                </div>
              ))}
            </div>

          {/* No results */}
          {filteredGerman.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", padding: "2.5rem" }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.75rem" }}>🔍</p>
              <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>No universities found</p>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginBottom: "1rem" }}>Try a different search term or filter</p>
              <button style={{ padding: "8px 20px", fontSize: "13px", borderRadius: "var(--border-radius-md)", background: "transparent", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", cursor: "pointer", fontFamily: "inherit" }} onClick={() => { setDeSearch(""); setDeFilter("All"); }}>Clear filters</button>
            </div>
          )}

          {/* Pagination */}
          {totalDePages > 1 && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap", alignItems: "center" }}>
                {safePage > 1 && <button style={S.pageBtn(false)} onClick={() => setDePage(p => p - 1)}>← Prev</button>}
                {Array.from({ length: Math.min(totalDePages, 7) }, (_, i) => {
                  let p;
                  if (totalDePages <= 7) p = i + 1;
                  else if (safePage <= 4) p = i + 1;
                  else if (safePage >= totalDePages - 3) p = totalDePages - 6 + i;
                  else p = safePage - 3 + i;
                  return <button key={p} style={S.pageBtn(p === safePage)} onClick={() => setDePage(p)}>{p}</button>;
                })}
                {safePage < totalDePages && <button style={S.pageBtn(false)} onClick={() => setDePage(p => p + 1)}>Next →</button>}
              </div>
              <p style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
                Page {safePage} of {totalDePages} · {filteredGerman.length} universities
              </p>
            </div>
          )}

          {/* DAAD callout */}
          <div style={{ marginTop: "2rem", background: "rgba(26,63,168,0.06)", border: "0.5px solid rgba(26,63,168,0.15)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem", display: "flex", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <span style={{ fontSize: "28px" }}>🎓</span>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: "14px" }}>DAAD Scholarships — Germany's main international scholarship</p>
              <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 10px", lineHeight: 1.6 }}>
                The German Academic Exchange Service (DAAD) offers hundreds of scholarships for international students and researchers. Covers tuition, living costs and health insurance.
              </p>
              <a href="https://www.daad.de/en/study-and-research-in-germany/scholarships/" target="_blank" rel="noopener noreferrer"
                style={{ fontSize: "13px", color: "#1A3FA8", fontWeight: 500, textDecoration: "none" }}>
                Explore DAAD scholarships ↗
              </a>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// ─── Page routing (outside component) ──────────────────────────────────────
const PAGE_SLUGS = {
  "Home": "",
  "AI Mentor": "ai-mentor",
  "Education Paths": "education",
  "UK Universities": "universities",
  "Sponsorship Jobs": "jobs",
  "Visa Sponsors": "visa-sponsors",
  "Contact": "contact",
  "My Profile": "profile",
  "Privacy Policy": "privacy",
  "Terms & Conditions": "terms",
  "Guide": "guide",
};
const SLUG_TO_PAGE = Object.fromEntries(Object.entries(PAGE_SLUGS).map(([k,v]) => [v, k]));

export default function Mentorgram() {
  function getInitialPage() {
    const path = window.location.pathname.replace("/", "").split("?")[0];
    return SLUG_TO_PAGE[path] || "Home";
  }

  const [activePage, setActivePage] = useState(getInitialPage);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! I'm your Mentorgram AI Mentor 👋 I can help with education pathways, UK university applications, career guidance, and visa-sponsored jobs. What would you like to explore?" }]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [allJobs, setAllJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  // ✅ NEW: pendingJobId state for resolving shared job links
  const [pendingJobId, setPendingJobId] = useState(null);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistDone, setWaitlistDone] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("mg_user") || "null"); } catch { return null; }
  });
  const [cookieConsent, setCookieConsent] = useState(() => localStorage.getItem("mg_cookies") || null);
  const [profileFilter, setProfileFilter] = useState(null);
  const [pageTransition, setPageTransition] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // ✅ UPDATED: hash handler now uses job ID instead of decoding base64
  useEffect(() => {
    function checkHash() {
      try {
        const hash = window.location.hash;
        if (hash.startsWith("#job=")) {
          const jobId = hash.replace("#job=", "");
          setActivePage("Sponsorship Jobs");
          setPendingJobId(jobId);
          return;
        }
        const path = window.location.pathname.replace("/", "").split("?")[0];
        const page = SLUG_TO_PAGE[path];
        if (page) setActivePage(page);
      } catch { /* ignore */ }
    }
    checkHash();
    window.addEventListener("popstate", checkHash);
    return () => window.removeEventListener("popstate", checkHash);
  }, []);

  // ✅ NEW: resolve pendingJobId once jobs have loaded
  useEffect(() => {
    if (pendingJobId && allJobs.length > 0) {
      const found = allJobs.find(j => String(j.id) === String(pendingJobId));
      if (found) {
        setSelectedJob(found);
        setPendingJobId(null);
      }
    }
  }, [pendingJobId, allJobs]);

  useEffect(() => {
    if (activePage === "Sponsorship Jobs" && !selectedJob && allJobs.length <= 75) {
      fetchJobs("", "");
    }
  }, [activePage]);

  async function fetchJobs(q, loc) {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (loc) params.set("location", loc);
      params.set("pageSize", "5000");

      let dbJobs = [];
      let rssJobs = [];

      const [dbRes, rssRes, indeedRes] = await Promise.allSettled([
        fetch(`/api/jobs-db?${params}`).then(r => r.json()).catch(() => ({ jobs: [] })),
        fetch(`/api/jobsacuk?${params}`).then(r => r.json()).catch(() => ({ jobs: [] })),
        fetch(`/api/jobs?${params}`).then(r => r.json()).catch(() => ({ jobs: [] })),
      ]);

      dbJobs     = dbRes.status     === "fulfilled" ? (dbRes.value?.jobs     || []) : [];
      rssJobs    = rssRes.status    === "fulfilled" ? (rssRes.value?.jobs    || []) : [];
      const indeedJobs = indeedRes.status === "fulfilled" ? (indeedRes.value?.jobs || []) : [];

      const allSources = [...dbJobs, ...rssJobs, ...indeedJobs];

      const seen = new Set();
      const combined = allSources.filter(j => {
        if (!j.url || seen.has(j.url)) return false;
        seen.add(j.url);
        return true;
      });

      const filtered = (q || loc) ? combined.filter(j => {
        const matchQ = !q || j.title.toLowerCase().includes(q.toLowerCase()) ||
          j.company.toLowerCase().includes(q.toLowerCase()) ||
          j.sector.toLowerCase().includes(q.toLowerCase());
        const matchL = !loc || j.location.toLowerCase().includes(loc.toLowerCase());
        return matchQ && matchL;
      }) : combined;

      if (filtered.length > 0) {
        setAllJobs(filtered);
        setUpdatedAt(new Date().toISOString());
      }
    } catch { /* keep existing jobs */ }
    setJobsLoading(false);
  }

  async function sendMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    const updatedMessages = [...messages, { role: "user", content: msg }];
    setMessages(updatedMessages);
    setChatLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Could you rephrase that?" }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, trouble connecting. Please try again." }]);
    }
    setChatLoading(false);
  }

  function navTo(page) {
    setPageTransition(true);
    setTimeout(() => {
      setActivePage(page);
      setMobileMenu(false);
      setSelectedJob(null);
      setPageTransition(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      const slug = PAGE_SLUGS[page] || "";
      window.history.pushState(null, "", slug ? `/${slug}` : "/");
      if (window.va) window.va("pageview", { path: slug ? `/${slug}` : "/" });
    }, 220);
  }

  const heroAccent = { background: "linear-gradient(135deg, #1A3FA8, #FF4500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" };

  function renderPage() {
    switch (activePage) {
      case "Home": return (
        <div>
          <style>{`
            @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
            @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
            @keyframes countUp { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }
            @keyframes slideIn { from { opacity:0; transform:translateX(-20px); } to { opacity:1; transform:translateX(0); } }
            @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
            @keyframes orb1 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(60px,-40px); } 66% { transform:translate(-30px,50px); } }
            @keyframes orb2 { 0%,100% { transform:translate(0,0); } 33% { transform:translate(-50px,60px); } 66% { transform:translate(40px,-30px); } }
            @keyframes orb3 { 0%,100% { transform:translate(0,0); } 50% { transform:translate(30px,40px); } }
            @keyframes particle { 0% { transform:translateY(0) rotate(0deg); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform:translateY(-600px) rotate(720deg); opacity:0; } }
            .hero-badge { animation:fadeIn 0.6s ease forwards; }
            .hero-title { animation:fadeUp 0.7s ease 0.1s both; }
            .hero-sub { animation:fadeUp 0.7s ease 0.2s both; }
            .hero-btns { animation:fadeUp 0.7s ease 0.3s both; }
            .stat-card { animation:countUp 0.6s ease both; }
            .stat-card:nth-child(1){animation-delay:0.4s} .stat-card:nth-child(2){animation-delay:0.5s} .stat-card:nth-child(3){animation-delay:0.6s} .stat-card:nth-child(4){animation-delay:0.7s}
            .feature-card { animation:fadeUp 0.6s ease both; transition:transform 0.2s,box-shadow 0.2s; }
            .feature-card:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(26,63,168,0.12); }
            .feature-card:nth-child(1){animation-delay:0.1s} .feature-card:nth-child(2){animation-delay:0.2s} .feature-card:nth-child(3){animation-delay:0.3s} .feature-card:nth-child(4){animation-delay:0.4s} .feature-card:nth-child(5){animation-delay:0.5s} .feature-card:nth-child(6){animation-delay:0.6s}
            .float-icon { animation:float 3s ease-in-out infinite; display:inline-block; }
            .hero-btn-primary { transition:transform 0.15s,background 0.15s; } .hero-btn-primary:hover { transform:scale(1.03); background:#4840a0 !important; }
            .hero-btn-outline { transition:transform 0.15s,background 0.15s; } .hero-btn-outline:hover { transform:scale(1.03); background:var(--color-background-secondary) !important; }
            .step-item { animation:slideIn 0.6s ease both; }
            .step-item:nth-child(1){animation-delay:0.1s} .step-item:nth-child(2){animation-delay:0.25s} .step-item:nth-child(3){animation-delay:0.4s} .step-item:nth-child(4){animation-delay:0.55s}
            .shimmer-text { background:linear-gradient(90deg,#1A3FA8,#FF4500,#1A3FA8); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:shimmer 3s linear infinite; }
            .orb1 { animation:orb1 12s ease-in-out infinite; } .orb2 { animation:orb2 15s ease-in-out infinite; } .orb3 { animation:orb3 10s ease-in-out infinite; }
            .particle { animation:particle linear infinite; position:absolute; bottom:-10px; border-radius:50%; }
            .particle:nth-child(1){left:10%;animation-duration:8s;width:6px;height:6px}
            .particle:nth-child(2){left:20%;animation-duration:10s;animation-delay:1s;width:4px;height:4px}
            .particle:nth-child(3){left:35%;animation-duration:7s;animation-delay:2s;width:5px;height:5px}
            .particle:nth-child(4){left:50%;animation-duration:11s;animation-delay:0.5s;width:3px;height:3px}
            .particle:nth-child(5){left:65%;animation-duration:9s;animation-delay:1.5s;width:6px;height:6px}
            .particle:nth-child(6){left:75%;animation-duration:12s;animation-delay:3s;width:4px;height:4px}
            .particle:nth-child(7){left:85%;animation-duration:8s;animation-delay:2.5s;width:5px;height:5px}
            .particle:nth-child(8){left:90%;animation-duration:10s;animation-delay:4s;width:3px;height:3px}
          `}</style>

          <div style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
              <div className="orb1" style={{ position: "absolute", top: "5%", left: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(26,63,168,0.18) 0%, transparent 70%)", filter: "blur(40px)" }} />
              <div className="orb2" style={{ position: "absolute", top: "10%", right: "5%", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(29,158,117,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
              <div className="orb3" style={{ position: "absolute", bottom: "5%", left: "40%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(26,63,168,0.1) 0%, transparent 70%)", filter: "blur(50px)" }} />
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(26,63,168,1) 1px,transparent 1px),linear-gradient(90deg,rgba(26,63,168,1) 1px,transparent 1px)", backgroundSize: "60px 60px", opacity: 0.04 }} />
              <div style={{ position: "absolute", inset: 0 }}>
                {[...Array(8)].map((_, i) => <div key={i} className="particle" style={{ background: i % 2 === 0 ? "rgba(26,63,168,0.5)" : "rgba(29,158,117,0.5)" }} />)}
              </div>
            </div>

            <div style={{ padding: "5rem 1.5rem 4rem", textAlign: "center", maxWidth: "760px", margin: "0 auto", position: "relative", zIndex: 1 }}>
              <div className="hero-badge" style={{ ...S.tag("purple"), marginBottom: "1.25rem", fontSize: "13px" }}>🚀 AI-Powered Education & Career Platform</div>
              <h1 className="hero-title" style={{ fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 500, lineHeight: 1.15, margin: "0 0 1.25rem" }}>
                Your AI Mentor for<br /><span className="shimmer-text">Education & UK Careers</span>
              </h1>
              <p className="hero-sub" style={{ fontSize: "1.1rem", color: "var(--color-text-secondary)", lineHeight: 1.8, margin: "0 0 2.25rem", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>
                Mentorgram guides students from education to employment across the UK, Australia, Germany, Finland and Austria — with AI mentoring, university pathways, and visa-sponsored job opportunities.
              </p>
              <div className="hero-btns" style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button className="hero-btn-primary" style={S.btnPrimary} onClick={() => navTo("AI Mentor")}>Chat with AI Mentor</button>
                <button className="hero-btn-outline" style={S.btnOutline} onClick={() => navTo("Sponsorship Jobs")}>Browse Jobs</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: "1rem", margin: "3rem 0 0" }}>
                {[["5","Countries Covered","🌍"],["Free","To Use","✨"],["500+","Visa Sponsors","🏢"],["1,000+","Live Jobs","💼"]].map(([n,l,icon]) => (
                  <div key={l} className="stat-card" style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "1.25rem 1rem", textAlign: "center", border: "0.5px solid var(--color-border-tertiary)" }}>
                    <div style={{ fontSize: "22px", marginBottom: "6px" }}>{icon}</div>
                    <p style={{ fontSize: "26px", fontWeight: 500, margin: "0 0 4px" }}>{n}</p>
                    <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "3rem 1.5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h2 style={{ ...S.sectionTitle, textAlign: "center", marginBottom: "0.5rem" }}>How Mentorgram works</h2>
              <p style={{ ...S.sectionSub, textAlign: "center", marginBottom: "2.5rem" }}>Four simple steps from student to UK career</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1rem" }}>
                {[{ step:"01",icon:"🗺️",title:"Choose your pathway",desc:"Tell us your education background and career goals." },{ step:"02",icon:"🤖",title:"Get AI guidance",desc:"Your personal AI mentor creates a tailored plan." },{ step:"03",icon:"🎓",title:"Apply to UK universities",desc:"Navigate UCAS with expert step-by-step support." },{ step:"04",icon:"💼",title:"Land a sponsored job",desc:"Find UK employers who will sponsor your visa." }].map(s => (
                  <div key={s.step} className="step-item" style={{ display: "flex", gap: "14px", alignItems: "flex-start", padding: "1.25rem", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }}>
                    <div style={{ minWidth: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg,#1A3FA8,#FF4500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 500 }}>{s.step}</div>
                    <div>
                      <p style={{ fontWeight: 500, margin: "0 0 4px", fontSize: "15px" }}>{s.title}</p>
                      <p style={{ color: "var(--color-text-secondary)", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "3rem 1.5rem" }}>
            <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
              <h2 style={{ ...S.sectionTitle, textAlign: "center", marginBottom: "0.5rem" }}>Everything you need to succeed</h2>
              <p style={{ ...S.sectionSub, textAlign: "center", marginBottom: "2.5rem" }}>From subject selection to landing your first UK job.</p>
              <div style={S.grid3}>
                {FEATURES.map(f => (
                  <div key={f.title} className="feature-card" style={S.card}>
                    <div className="float-icon" style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                    <p style={{ fontWeight: 500, margin: "0 0 6px", fontSize: "15px" }}>{f.title}</p>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: "4rem 1.5rem", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ maxWidth: "540px", margin: "0 auto", textAlign: "center" }}>
              <h2 style={S.sectionTitle}>Join the waitlist</h2>
              <p style={S.sectionSub}>Be among the first to access Mentorgram's full platform.</p>
              {waitlistDone ? (
                <div style={{ ...S.card, background: "rgba(255,69,0,0.1)", border: "0.5px solid rgba(255,69,0,0.3)" }}><p style={{ color: "#FF4500", fontWeight: 500, margin: 0 }}>🎉 You're on the list! We'll be in touch soon.</p></div>
              ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                  <input style={{ ...S.input, flex: 1 }} type="email" placeholder="Enter your email address" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && waitlistEmail && setWaitlistDone(true)} />
                  <button style={S.btnPrimary} onClick={() => waitlistEmail && setWaitlistDone(true)}>Join</button>
                </div>
              )}
            </div>
          </div>
        </div>
      );

      case "AI Mentor": return (
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "4rem 1.5rem", textAlign: "center" }}>
          <div style={{ fontSize: "56px", marginBottom: "1.5rem" }}>🤖</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 500, margin: "0 0 0.75rem", color: "var(--color-text-primary)" }}>AI Mentor</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "16px", lineHeight: 1.7, margin: "0 0 2rem" }}>
            We're building something powerful — a personalised AI mentor that guides you through education pathways, career decisions, and UK visa-sponsored job opportunities.
          </p>
          <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#16A34A", margin: "0 0 0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>✦ Coming Soon</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
              {["Personalised career roadmaps for your background", "UK, Australia, Germany, Finland & Austria pathways", "Visa guidance and sponsorship job matching", "University application support (UCAS & international)", "Live industry demand forecasts and salary insights"].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ color: "#1A3FA8", fontWeight: 600, flexShrink: 0 }}>→</span>
                  <span style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Want early access?{" "}
            <button onClick={() => navTo("Contact")} style={{ background: "none", border: "none", color: "#1A3FA8", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: 500, padding: 0, textDecoration: "underline" }}>
              Get in touch
            </button>
          </p>
        </div>
      );

      case "Education Paths": return (
        <div style={S.section}>
          <h2 style={S.sectionTitle}>Education pathways</h2>
          <p style={S.sectionSub}>Supporting students from all major education systems worldwide.</p>
          <div style={S.grid2}>
            {EDUCATION_SYSTEMS.map(e => (
              <div key={e.country} style={S.card}>
                <p style={{ fontWeight: 500, margin: "0 0 10px", fontSize: "15px" }}>{e.country}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{e.systems.map(sys => <span key={sys} style={S.tag("purple")}>{sys}</span>)}</div>
                <button style={{ ...S.btnOutline, marginTop: "12px", padding: "8px 16px", fontSize: "13px" }} onClick={() => { setChatInput(`Tell me about ${e.systems[0]} and UK university pathways`); navTo("AI Mentor"); }}>Get guidance ↗</button>
              </div>
            ))}
          </div>
        </div>
      );

      // ✅ UPDATED: UK Universities page now includes German universities section with tab switcher
      case "UK Universities": return (
        <UniversitiesPage setChatInput={setChatInput} navTo={navTo} />
      );

      case "Sponsorship Jobs": return selectedJob ? (
        <JobDetailPage job={selectedJob} onBack={() => { setSelectedJob(null); window.location.hash = ""; }} onAskMentor={(msg) => { setChatInput(msg); setSelectedJob(null); navTo("AI Mentor"); }} />
      ) : (
        <JobsPage allJobs={allJobs} jobsLoading={jobsLoading} updatedAt={updatedAt} onFetchJobs={fetchJobs}
          onSelectJob={(job) => { setSelectedJob(job); window.scrollTo(0, 0); }}
          profileFilter={profileFilter} onClearProfileFilter={() => setProfileFilter(null)} />
      );

      case "Contact": return <ContactPage />;
      case "Visa Sponsors": return <SponsorsPage />;
      case "Privacy Policy": return <PrivacyPage />;
      case "Terms & Conditions": return <TermsPage />;
      case "Guide": return <GuidePage navTo={navTo} />;

      case "My Profile": return user ? (
        <Dashboard
          user={user}
          allJobs={allJobs}
          onLogout={() => { setUser(null); navTo("Home"); }}
          onFilterByProfile={(filter) => setProfileFilter(filter)}
          onNavigate={navTo}
        />
      ) : (
        <AuthPage onLogin={(u) => { setUser(u); }} onNavToHome={() => navTo("Home")} />
      );

      default: return null;
    }
  }

  return (
    <div style={S.wrap}>
      <style>{`
        @media (max-width: 768px) { .desktop-nav { display:none !important; } .hamburger-btn { display:flex !important; } }
        @media (min-width: 769px) { .mobile-menu { display:none !important; } .hamburger-btn { display:none !important; } .desktop-nav { display:flex !important; } }
      `}</style>
      <nav style={{ background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", cursor: "pointer" }} onClick={() => navTo("Home")}>
          <img src="/logo.png" alt="Mentorgram" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "22%", display: "block" }} />
          <span style={{ fontSize: "17px", fontWeight: 600, color: "var(--color-text-primary)", letterSpacing: "-0.01em" }}>Mentorgram</span>
        </div>
        <div className="desktop-nav" style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {NAV_LINKS.filter(l => l !== "My Profile").map(l => {
            const isDisabled = l === "AI Mentor";
            return (
              <button key={l} className="nav-btn"
                style={{ padding: "6px 12px", borderRadius: "var(--border-radius-md)", cursor: isDisabled ? "default" : "pointer", fontSize: "14px", background: activePage === l ? "var(--color-background-secondary)" : "transparent", color: isDisabled ? "var(--color-border-secondary)" : activePage === l ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit", opacity: isDisabled ? 0.45 : 1 }}
                onClick={() => !isDisabled && navTo(l)}
                title={isDisabled ? "Coming soon" : ""}
              >
                {l}{isDisabled && <span style={{ fontSize: "9px", background: "rgba(128,128,128,0.15)", color: "var(--color-text-secondary)", padding: "1px 5px", borderRadius: "4px", marginLeft: "4px", verticalAlign: "middle" }}>Soon</span>}
              </button>
            );
          })}
          {user ? (
            <button onClick={() => navTo("My Profile")} title="My Dashboard" style={{ width: "34px", height: "34px", borderRadius: "50%", background: activePage === "My Profile" ? "#1A3FA8" : "linear-gradient(135deg,#1A3FA8,#FF4500)", border: "none", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: "13px", fontFamily: "inherit" }}>
              {(user.user_metadata?.full_name || user.email || "?")[0].toUpperCase()}
            </button>
          ) : (
            <button onClick={() => navTo("My Profile")} style={{ padding: "6px 16px", borderRadius: "var(--border-radius-md)", background: "#1A3FA8", color: "#fff", border: "none", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Sign in</button>
          )}
        </div>
        <button className="hamburger-btn" style={{ display: "none", flexDirection: "column", gap: "5px", cursor: "pointer", padding: "8px", border: "none", background: "transparent" }} onClick={() => setMobileMenu(m => !m)}>
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", transition: "transform 0.2s", transform: mobileMenu ? "rotate(45deg) translate(5px,5px)" : "none" }} />
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", opacity: mobileMenu ? 0 : 1, transition: "opacity 0.2s" }} />
          <span style={{ width: "22px", height: "2px", background: "var(--color-text-primary)", borderRadius: "2px", display: "block", transition: "transform 0.2s", transform: mobileMenu ? "rotate(-45deg) translate(5px,-5px)" : "none" }} />
        </button>
      </nav>
      <div className="mobile-menu" style={{ display: mobileMenu ? "flex" : "none", flexDirection: "column", position: "fixed", top: "60px", left: 0, right: 0, background: "var(--color-background-primary)", borderBottom: "0.5px solid var(--color-border-tertiary)", padding: "0.75rem 1rem", gap: "4px", zIndex: 99 }}>
        {NAV_LINKS.filter(l => l !== "My Profile").map(l => {
          const isDisabled = l === "AI Mentor";
          return (
            <button key={l}
              style={{ padding: "12px 14px", borderRadius: "var(--border-radius-md)", cursor: isDisabled ? "default" : "pointer", fontSize: "15px", background: activePage === l ? "var(--color-background-secondary)" : "transparent", color: isDisabled ? "var(--color-border-secondary)" : activePage === l ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%", fontWeight: activePage === l ? 500 : 400, opacity: isDisabled ? 0.5 : 1 }}
              onClick={() => !isDisabled && navTo(l)}
            >
              {l}{isDisabled && <span style={{ fontSize: "10px", marginLeft: "6px", color: "var(--color-text-secondary)" }}>— Coming soon</span>}
            </button>
          );
        })}
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", marginTop: "4px", paddingTop: "8px" }}>
          {user ? (
            <button onClick={() => { navTo("My Profile"); setMobileMenu(false); }}
              style={{ padding: "12px 14px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "15px", background: activePage === "My Profile" ? "var(--color-background-secondary)" : "transparent", color: "var(--color-text-primary)", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%", fontWeight: 500, display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#1A3FA8,#FF4500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 600, fontSize: "12px", flexShrink: 0 }}>
                {(user.user_metadata?.full_name || user.email || "?")[0].toUpperCase()}
              </div>
              My Dashboard
            </button>
          ) : (
            <button onClick={() => { navTo("My Profile"); setMobileMenu(false); }}
              style={{ padding: "12px 14px", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontSize: "15px", background: "#1A3FA8", color: "#fff", border: "none", fontFamily: "inherit", textAlign: "left", width: "100%", fontWeight: 500 }}>
              Sign In / Register
            </button>
          )}
        </div>
      </div>
      <main onClick={() => mobileMenu && setMobileMenu(false)} style={{ paddingBottom: cookieConsent ? 0 : "80px" }}>
        <style>{`
          @keyframes pageIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pageOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-8px); } }
          @keyframes jobCardPop { 0% { transform: scale(1); } 40% { transform: scale(0.97); } 70% { transform: scale(1.02); } 100% { transform: scale(1); } }
          .page-enter { animation: pageIn 0.3s ease forwards; }
          .page-exit { animation: pageOut 0.2s ease forwards; }
          .job-card-click { animation: jobCardPop 0.35s ease forwards; }
          .nav-btn { transition: all 0.15s ease; }
          .nav-btn:hover { transform: translateY(-1px); }
        `}</style>
        <div className={pageTransition ? "page-exit" : "page-enter"} key={activePage}>
          {renderPage()}
        </div>
      </main>
      <footer style={S.footer}>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "14px" }}>
          <a href="https://www.linkedin.com/company/mentorgramai" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "13px", fontWeight: 500, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#0A66C2"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
          <a href="https://www.instagram.com/mentorgramai" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "13px", fontWeight: 500, transition: "color 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#E1306C"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            Instagram
          </a>
        </div>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", margin: 0 }}>© 2026 Mentorgram AI · <span style={{ textDecoration: "none" }}>info@mentorgramai.com</span> · mentorgramai.com</p>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "12px", margin: "6px 0 0" }}>Guiding students to study, work and thrive in 🇬🇧 UK · 🇦🇺 Australia · 🇩🇪 Germany · 🇫🇮 Finland · 🇦🇹 Austria</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
          {["Privacy Policy", "Terms & Conditions", "Contact"].map(l => (
            <button key={l} onClick={() => navTo(l)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>{l}</button>
          ))}
        </div>
      </footer>

      {!cookieConsent && (
        <CookieBanner
          onAccept={() => { localStorage.setItem("mg_cookies", "all"); setCookieConsent("all"); }}
          onReject={() => { localStorage.setItem("mg_cookies", "essential"); setCookieConsent("essential"); }}
        />
      )}
    </div>
  );
}
