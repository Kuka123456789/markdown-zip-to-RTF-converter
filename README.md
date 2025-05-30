# Markdown to RTF Converter

A powerful web application that converts multiple Markdown files from a ZIP archive into a single, optimized RTF document. Built with Next.js and featuring advanced file management, optimization, and customization options.

## 🚀 Features

### Core Functionality
- **ZIP File Processing**: Upload ZIP files containing multiple Markdown (.md) files
- **Selective Conversion**: Choose which files to include in the final RTF document
- **Smart File Management**: Handle large numbers of files with ease
- **Custom Output**: Choose your own filename for the resulting RTF file

### Advanced File Management
- **Search & Filter**: Find files quickly with real-time search
- **Sorting Options**: Sort by name, size, or file path
- **File Preview**: Preview Markdown content before conversion
- **Bulk Selection**: Select all or none with one click
- **File Size Display**: See individual file sizes at a glance

### Optimization Engine
- **Content Deduplication**: Automatically removes duplicate files
- **Whitespace Optimization**: Removes excessive empty lines and spaces
- **RTF Code Optimization**: Compresses RTF formatting for smaller file sizes
- **Size Reduction**: Typically achieves 10-40% file size reduction
- **Content Preservation**: Maintains all valuable content and formatting

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Progress Tracking**: Real-time progress indicators for all operations
- **Error Handling**: Clear error messages and validation
- **Accessibility**: Built with accessibility best practices

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **File Processing**: JSZip for ZIP file handling
- **Icons**: Lucide React

## 📋 Supported Markdown Features

The converter supports all common Markdown elements:

- **Headers** (H1, H2, H3)
- **Text Formatting** (Bold, Italic)
- **Lists** (Bulleted and Numbered)
- **Code Blocks** (Inline and Block)
- **Paragraphs** and Line Breaks

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/markdown-to-rtf-converter.git
cd markdown-to-rtf-converter
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## 📖 How to Use

1. **Upload**: Select a ZIP file containing your Markdown files
2. **Extract**: The app automatically extracts and lists all .md files
3. **Select**: Choose which files to include using checkboxes
4. **Search**: Use the search bar to find specific files
5. **Sort**: Sort files by name, size, or path for better organization
6. **Preview**: Click the eye icon to preview file contents
7. **Customize**: Set your desired output filename
8. **Optimize**: Enable optimization to reduce file size (recommended)
9. **Convert**: Click convert to process selected files
10. **Download**: Download your combined RTF document

## ⚙️ Optimization Features

### Content-Level Optimizations
- Removes files with identical content
- Eliminates excessive whitespace and empty lines
- Normalizes spacing while preserving code blocks

### RTF-Specific Optimizations
- Compresses RTF control codes
- Removes redundant formatting
- Optimizes font and paragraph declarations
- Eliminates empty formatting groups

### Results
- **Typical reduction**: 10-40% smaller file size
- **Zero content loss**: All text and formatting preserved
- **Performance**: Optimizations complete in seconds

## 🔧 Configuration

The app works out of the box with sensible defaults:

- **Default filename**: "combined-markdown"
- **Optimization**: Enabled by default
- **File selection**: All files selected initially
- **Sorting**: Alphabetical by name

## 📁 Project Structure

\`\`\`
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application component
│   ├── globals.css         # Global styles
│   └── loading.tsx         # Loading component
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   └── utils.ts           # Utility functions
├── public/                # Static assets
└── README.md              # This file
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines

1. Follow TypeScript best practices
2. Use Tailwind CSS for styling
3. Maintain accessibility standards
4. Add appropriate error handling
5. Include tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

If you encounter any bugs or issues, please [open an issue](https://github.com/your-username/markdown-to-rtf-converter/issues) with:

- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Sample files (if applicable)

## 🚀 Deployment

This app is optimized for deployment on:

- **Vercel** (recommended)
- **Netlify**
- **Any Node.js hosting platform**

### Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/markdown-to-rtf-converter)

## 📊 Performance

- **File Processing**: Handles hundreds of files efficiently
- **Memory Usage**: Optimized for large ZIP files
- **Browser Compatibility**: Works in all modern browsers
- **Mobile Support**: Fully responsive design

## 🔮 Future Enhancements

- [ ] Support for additional input formats (HTML, TXT)
- [ ] Multiple output formats (DOCX, PDF)
- [ ] Advanced RTF styling options
- [ ] Batch processing of multiple ZIP files
- [ ] Cloud storage integration
- [ ] Custom RTF templates

---

**Built with ❤️ using Next.js and modern web technologies**
