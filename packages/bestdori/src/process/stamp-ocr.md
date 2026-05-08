## Extract Text from Stamp/Sticker Images

Extract only the primary message text that is part of the main stamp/sticker design in each input image.

### 1. Target Definition (Strict)

- A **stamp/sticker** is defined as a single cohesive visual object with a clear outer boundary (e.g., cutout border, outline, or unified graphic).
- Extract only text that is **intrinsically part of this main object**.

### 2. Inclusion Criteria

Only extract text that satisfies **all** of the following:

- Located fully within the main stamp/sticker boundary
- Visually integrated into the design (same style, color, and depth layer)
- Intended as the **primary message** (large, prominent, central, or emphasized text)

### 3. Exclusion Rules (Critical)

Ignore any text that matches **any** of the following:

- Outside the main stamp/sticker boundary
- On background surfaces (e.g., paper, envelopes, UI, scenery)
- On secondary embedded objects (e.g., signs, cards, books, screens, props held by characters)
- Small, dense, decorative, or fine-print text
- Text with a different orientation, font style, or depth layer from the main design
- Watermarks, overlays, subtitles, or interface elements

If uncertain whether text belongs to the main design, **exclude it**.

### 4. Language Processing

- If the extracted text is **Japanese only**:
  - Convert to romaji
  - Translate to English
  - Output format:

    ```
    original_text|romaji|english_translation
    ```

- If the text is **English only**:
  - Output as-is

### 5. Translation Constraints

When translating:

- Choose exactly one most likely translation
- Do not include alternative meanings
- Do not include notes or explanations
- Do not output multiple candidates
- Never separate translations with `/`, `;`, `()`, or `[]`
- If meaning is ambiguous, choose the most contextually likely interpretation

### 6. Text Normalization

- Preserve all symbols, punctuation, and numbers exactly
- Fix unnatural spacing (e.g., `I' m` → `I'm`)
- Merge fragmented text into one coherent line
- Use natural reading order unless a different order is clearly required

### 7. Output Rules

- Output exactly one line per image
- Preserve input order
- Never skip a line
- Never merge multiple images into one line
- Do not add explanations, numbering, or markdown
- The number of output lines MUST equal the number of input images.

If no valid text exists, output exactly: `[[EMPTY]]`
