import "./App.css";

function App() {
  return (
    <div className="portfolio">

      {/* Navigation */}
      <nav className="navbar">
        <div className="logo">
          <img src="/personal-portfolio.png" alt="Dharani Logo" />
          <span>Dharani</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      {/* Home */}
      <section id="home" className="hero">
        <div className="hero-content">
          <p className="welcome">WELCOME TO MY PORTFOLIO</p>

          <h1>
            Hi, I'm <span>Dharani</span>
          </h1>

          <h2>Frontend Developer</h2>

          <p>
            I create modern, responsive and user-friendly websites
            using HTML, CSS, JavaScript and React.js.
          </p>

          <div className="hero-buttons">
            <a href="#projects" className="btn">
              View Projects
            </a>

            <a href="#contact" className="btn secondary">
              Contact Me
            </a>
          </div>
        </div>
      </section>

    
{/* About */}
<section id="about" className="section">
  <h2>About Me</h2>

  <div className="about-container">
    <div className="about-text">
      <p>
        I am a passionate and motivated aspiring software developer with
        a strong interest in web development and modern technologies.
        I enjoy transforming ideas into responsive, user-friendly, and
        visually appealing web applications.
      </p>

      <p>
        I have hands-on experience with HTML, CSS, JavaScript, and
        React.js, and I continuously work on improving my programming
        and problem-solving skills through practical projects.
      </p>

      <p>
        I am a quick learner who enjoys exploring new technologies,
        developing creative solutions, and working on projects that
        provide meaningful and engaging user experiences. My goal is
        to build a strong career in software development while
        continuously learning and growing as a professional.
      </p>
    </div>
  </div>
</section>


      {/* Skills */}
      <section id="skills" className="section skills-section">
        <h2>My Skills</h2>

        <div className="skills-container">
          <div className="skill-card">
            <h3>HTML</h3>
            <p>Building structured and semantic web pages.</p>
          </div>

          <div className="skill-card">
            <h3>CSS</h3>
            <p>Creating responsive and attractive user interfaces.</p>
          </div>

          <div className="skill-card">
            <h3>JavaScript</h3>
            <p>Adding functionality and interactivity to websites.</p>
          </div>

          <div className="skill-card">
            <h3>React.js</h3>
            <p>Building reusable and dynamic UI components.</p>
          </div>
        </div>
      </section>

      {/* Projects */}
<section id="projects" className="section">
  <h2>My Projects</h2>

  <div className="projects-container">

    {/* Project 1 */}
    <div className="project-card">
      <h3>Restaurant Website</h3>

      <p>
        A modern and responsive restaurant website with menu,
        food items, search functionality and an attractive user interface.
        
      </p>

      <a
        href=""
        target="_blank"
        rel="noopener noreferrer"
        className="project-btn"
      >
        View Project
      </a>
    </div>

    {/* Project 2 */}
    <div className="project-card">
      <h3>Student Attendance System</h3>

      <p>
        A student attendance management application for managing
        students and recording their daily attendance.
      </p>

      <a
        href=""
        target="_blank"
        rel="noopener noreferrer"
        className="project-btn"
      >
        View Project
      </a>
    </div>

    {/* Project 3 */}
    <div className="project-card">
      <h3>Recipe Website</h3>

      <p>
        A responsive recipe website that allows users to explore
        different recipes and cooking ideas.
      </p>

      <a
        href=""
        target="_blank"
        rel="noopener noreferrer"
        className="project-btn"
      >
        View Project
      </a>
    </div>

  </div>
</section>

      {/* Contact */}
      <section id="contact" className="section contact-section">
        <h2>Contact Me</h2>

        <form className="contact-form">
          <input
            type="text"
            placeholder="Your Name"
            required
          />

          <input
            type="email"
            placeholder="Your Email"
            required
          />

          <textarea
            placeholder="Your Message"
            rows="6"
            required
          ></textarea>

          <button type="submit">Send Message</button>
        </form>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 Dharani. All Rights Reserved.</p>
      </footer>

    </div>
  );
}

export default App;