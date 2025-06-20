# Bar Rule Study

A modern, interactive study tool for mastering bar examination rules. Features a clean interface with progress tracking, multiple study modes, and Excel import/export capabilities.

## Features

### 📚 Study Modes
- **Memory Challenge**: Test your knowledge by writing rules from memory
- **Practice Mode**: Type along with the rules for reinforcement
- **Hint System**: Get contextual hints when studying

### 🎯 Progress Tracking
- Track mastered rules with confidence levels
- Visual progress indicators with percentages
- Export progress data for backup/analysis

### 📊 Organization
- **Topic-based Structure**: Rules organized by legal topics
- **Subtopic Navigation**: Drill down into specific areas
- **Smart Filtering**: Only show relevant rules based on selections

### 💾 Data Management
- **Excel Import**: Upload your own rule sets via Excel files
- **Template Download**: Get started with a properly formatted template
- **Progress Export**: Download your study progress as Excel

### 🎨 User Experience
- **Compact Layout**: Side-by-side subtopics (2x2) and rules (3x3) grids
- **Color-coded Sections**: Orange for subtopics, purple for rules
- **Responsive Design**: Works on desktop and mobile devices
- **Clean Interface**: Focused on content without distractions

## Live Demo

🚀 **[Try it now](https://espositov.github.io/bar-rules)**

## Getting Started

### Quick Start
1. Select a topic from the grid
2. Choose a subtopic (if available)
3. Pick a rule to study
4. Write it from memory or use practice mode
5. Rate your confidence to track progress

### Using Your Own Data
1. Click **Template** to download the Excel format
2. Fill in your rules following the template structure
3. Click **Upload** to import your Excel file
4. Start studying with your custom content

## Technical Details

Built with:
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **XLSX** - Excel file processing
- **LocalStorage** - Progress persistence

### Development

```bash
# Clone the repository
git clone https://github.com/espositov/bar-rules.git
cd bar-rules

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## File Structure

```
src/
├── App.jsx          # Main application component
├── index.css        # Global styles with Tailwind
└── main.jsx         # Application entry point

public/
└── rules.json       # Default rule set
```

## Excel Format

The app expects Excel files with these columns:
- **Topic**: Main category (e.g., "Contracts")
- **Subtopic**: Subcategory (e.g., "Formation")
- **Rule Name**: Short descriptive name
- **Rule Text**: Full rule content

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this for your own studies or modify as needed.

---

Built for efficient bar exam preparation. Good luck with your studies! 📖⚖️