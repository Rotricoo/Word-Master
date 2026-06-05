# Word Master

A Wordle-inspired browser game built with Vanilla JavaScript, SCSS, BEM methodology, and a modular architecture.

## About This Project

This project started as part of the [Complete Intro to Web Development](https://frontendmasters.com/courses/web-development-v3/) course by **Brian Holt** on Frontend Masters. While the course provided a solid foundation, I decided to expand significantly beyond the original requirements to explore more advanced web development techniques and create a polished, production-ready game. It evolved from a simple JavaScript exercise into a fully modular application featuring SCSS architecture, BEM methodology, responsive design, and multiple gameplay enhancements.

## What I Learned

Throughout this project, I practiced and improved my skills in:

- Modular JavaScript architecture
- ES Modules
- SCSS organization and partials
- BEM naming methodology
- DOM manipulation
- Responsive design
- UI/UX improvements
- Git and GitHub workflows

## Live Demo

https://rotricoo.github.io/Word-Master/

## Game Features

- Multiple difficulty levels
- Dynamic word hints
- Timer system
- Give Up feature
- Light and Dark mode
- Responsive design
- Animated feedback messages
- Loading states
- Game result modal

### Core Gameplay

- **Classic Wordle mechanics** with 5-letter words and 6 attempts
- **Real-time word validation** using external API
- **Visual feedback** with color-coded tiles (green/yellow/red)
- **Smooth animations** for enhanced user experience

### Difficulty Levels

- **Easy Mode**: First 2 letters revealed as hints
- **Medium Mode**: First letter revealed as hint
- **Hard Mode**: No hints (classic Wordle experience)

### UI/UX Enhancements

- **Dark/Light Theme** with persistence
- **Responsive Design** - Works perfectly on mobile and desktop
- **Modern Modal System** instead of basic alerts
- **Loading States** with blur effects

## Technologies

- HTML5
- SCSS / SASS
- Vanilla JavaScript (ES Modules)
- BEM Methodology
- Git & GitHub

## Project Architecture

The project follows a modular architecture:

- game.js → core game logic
- state.js → application state
- level.js → difficulty management
- modal.js → result modal
- utilities.js → helper functions
- domElements.js → DOM references

### Styling Structure

The project uses SCSS partials:

- \_header.scss
- \_scoreboard.scss
- \_modal.scss
- \_loading.scss
- \_buttons.scss
- \_tempMessage.scss

## Design Decisions

- **Added difficulty system** to make the game accessible for different skill levels
- **Implemented theme switching** for better user preference support
- **Created progressive letter discovery** to reduce frustration
- **Built responsive design** for cross-device compatibility
- **Added professional UI elements** like modals and loading states

## Future Improvements

Potential future improvements include:

- Virtual keyboard
- Improved accessibility
- Additional game modes
- Enhanced player statistics
- Daily challenges
- Vocabulary-learning mode

## License

This project is open source and available under the [MIT License](LICENSE).
