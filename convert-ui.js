const fs = require('fs');

const files = [
  'src/app/instructor/page.tsx',
  'src/app/page.tsx',
  'src/app/submit/[assignment_code]/page.tsx',
  'src/app/questions/page.tsx',
  'src/app/grades/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.match(/<input\s/g) || content.match(/<button\b/g) || content.match(/<textarea\b/g)) {
    content = content.replace(/<input\b/g, '<Input')
                     .replace(/<\/input>/g, '</Input>')
                     .replace(/<button\b/g, '<Button')
                     .replace(/<\/button>/g, '</Button>')
                     .replace(/<textarea\b/g, '<Textarea')
                     .replace(/<\/textarea>/g, '</Textarea>');
    
    // add imports right after 'use client'
    const imports = [
      `import { Button } from "@/components/ui/Button";`,
      `import { Input } from "@/components/ui/Input";`,
      `import { Textarea } from "@/components/ui/Textarea";`
    ].join('\n');
    
    if (!content.includes('import { Button }')) {
      content = content.replace(/['"]use client['"];?/, `$& \n${imports}`);
    }
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Converted ${file}`);
  }
});
