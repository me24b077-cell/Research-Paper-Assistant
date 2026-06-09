import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limits for base64 file payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google Gemini Client (Server-side only)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

const STORE_PATH = path.join(process.cwd(), "papers_store.json");

// High-fidelity seed papers for first-time use
const seedPapers = [
  {
    id: "attention-2017",
    title: "Attention Is All You Need",
    authors: ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Łukasz Kaiser", "Illia Polosukhin"],
    year: "2017",
    journal: "NeurIPS 2017",
    oneLiner: "Introduces the Transformer, a novel sequence-to-sequence neural network architecture based entirely on self-attention mechanisms, fully replacing recurrent or convolutional layers.",
    problemStatement: "Recurrent models (like LSTMs and GRUs) process sequences sequentially, preventing parallelization during training and making it computationally expensive to capture dependency relationships across long token distances.",
    coreContribution: "The Transformer architecture relies purely on self-attention mechanisms (Scaled Dot-Product and Multi-Head Attention) to establish global dependencies between input and output, achieving state-of-the-art results with highly parallelized execution.",
    methodology: "Evaluated on English-to-German and English-to-French translation benchmarks using the WMT 2014 datasets. Compared training time, parameter efficiency, and BLEU scores against standard recurrent, convolutional, and hybrid sequence translation architectures.",
    keyResults: [
      "Achieved a BLEU score of 28.4 on the WMT 2014 English-to-German translation task, outperforming all existing ensembles by 2.0 BLEU.",
      "Achieved state-of-the-art BLEU score of 41.8 on English-to-French translation at a fraction of the computational training cost (trained in 3.5 days on 8 GPUs).",
      "Demonstrated that self-attention layers enjoy faster constant-time complexity than recurrent layers and are far superior at learning long-range dependencies."
    ],
    limitations: [
      "Quadratic computational complexity (O(N²)) of the global self-attention mechanism with respect to sequence length, restricting applicability to extremely long sequences.",
      "Requires massive quantities of labeled training data and premium compute substrates to converge compared to smaller recurrent architectures.",
      "Completely lacks built-in sequential bias, necessitating the use of additive sinusoidal positional encodings to preserve token order information."
    ],
    futureWork: [
      "Extending self-attention networks to multi-modal domains beyond text, including raw audio, high-resolution imagery, and video segmentation.",
      "Investigating localized or sparse attention alignments to lower the quadratic computational profile to linear or log-linear complexity.",
      "Exploring specialized pre-training regimens to improve low-data regimen generalizability in downstream tasks."
    ],
    tags: ["#nlp", "#transformers", "#neural-networks", "#attention-mechanism", "#deep-learning", "#seminal-paper"],
    confidenceScore: 5,
    readStatus: "Read Deeply", // "Read Deeply" | "Skim" | "Archived" | "Discarded"
    createdAt: new Date("2026-06-01T10:00:00Z").toISOString(),
    notes: "Crucial paper that sparked the entire modern generative AI revolution. Pay close attention to how Multi-Head Attention allows heads to attend to distinct representations."
  },
  {
    id: "bert-2018",
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: ["Jacob Devlin", "Ming-Wei Chang", "Kenton Lee", "Kristina Toutanova"],
    year: "2018",
    journal: "NAACL-HLT 2019",
    oneLiner: "Introduces BERT, which pre-trains deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context across all Transformer layers.",
    problemStatement: "Previous language representation models (like OpenAI GPT) were unidirectional, restricting representational capacity because self-attention could only look left-to-right, which is severely sub-optimal for token-level downstream tasks like question answering.",
    coreContribution: "The introduction of the Masked Language Model (MLM) pre-training objective which masks random tokens to enable bidirectional pre-training, paired with the Next Sentence Prediction (NSP) task to capture document coherence.",
    methodology: "Pre-trained a deep bidirectional Transformer on the BooksCorpus and English Wikipedia. Evaluated fine-tuning performance across 11 key NLP tasks including GLUE benchmarks, SQuAD question answering, and MultiNLI.",
    keyResults: [
      "Obtained state-of-the-art BLEU/GLUE scores (80.5%), a 7.7% absolute average improvement over previous best language understanding systems.",
      "Established a record 93.2% accuracy on the SQuAD v1.1 database, surpassing human performance scores.",
      "Proved that a simple fine-tuning model on top of pre-trained parameters requires minimal task-specific architectural changes."
    ],
    limitations: [
      "Disconnect between pre-training and fine-tuning: the [MASK] token is never observed during downstream fine-tuning tasks, causing minor pre-training distribution mismatch.",
      "Requires immense pre-training resources (BERT-Large required 64 TPU chips for 4 days), limiting broad pre-training exploration to well-funded labs.",
      "Struggles with generation tasks; because it is non-autoregressive, it is poorly optimized for open-ended creative story writing compared to GPT architectures."
    ],
    futureWork: [
      "Optimizing the pre-training objective to remove the [MASK] mismatch, eventually explored in architectures like XLNet.",
      "Distilling the large parameter footprint into lightweight edge models (later leading to DistilBERT and MobileBERT).",
      "Expanding bidirectional architectures to joint image-text multi-modal contrastive pre-training."
    ],
    tags: ["#nlp", "#bidirectional", "#pre-training", "#bert", "#finetuning"],
    confidenceScore: 5,
    readStatus: "Archived",
    createdAt: new Date("2026-06-02T14:30:00Z").toISOString(),
    notes: "Excellent for text embeddings, search, classification, and entity extraction. Remember that it doesn't do autoregressive text generation well."
  },
  {
    id: "resnet-2015",
    title: "Deep Residual Learning for Image Recognition",
    authors: ["Kaiming He", "Xiangyu Zhang", "Shaoqing Ren", "Jian Sun"],
    year: "2015",
    journal: "CVPR 2016",
    oneLiner: "Presents a residual learning framework (ResNet) that enables training of substantially deeper neural networks (up to 152 layers) by reformulating layers to learn residual mappings.",
    problemStatement: "As deep convolutional networks grow deeper, they hit a degradation problem: accuracy saturates and then degrades rapidly, driven not by overfitting but by vanishing/exploding gradients that hamper standard training optimization.",
    coreContribution: "The residual mapping block featuring shortcut/identity connections that skip one or more layers, allowing gradients to flow directly back through the network and enabling optimization of extremely deep architectures.",
    methodology: "Trained and evaluated deep residual networks of various layer depths (up to 152 layers) on ImageNet 2012 classification, CIFAR-10, and COCO object detection benchmarks, comparing direct stacked networks against residual variants.",
    keyResults: [
      "ResNet won 1st place in all five tracks of the ILSVRC & COCO 2015 competitions (ImageNet Classification, Detection, Localization, COCO Detection, and Segmentation).",
      "Demonstrated that a 152-layer ResNet achieves incredibly low 3.57% top-5 error on ImageNet while being less complex than VGG-16.",
      "Validated that residual connections successfully overcome optimization degradation, allowing deep networks to consistently yield lower training error than shallow counterparts."
    ],
    limitations: [
      "Extremely deep ResNets can have high inference latency, requiring hardware acceleration to operate efficiently in real-time embedded environments.",
      "Shortcut connections do not provide feature-reusability benefits inherent in alternative architectures like DenseNets (where outputs are concatenated rather than added).",
      "Extremely deep networks can be prone to spatial signal attenuation if residual mapping functions are initialized incorrectly."
    ],
    futureWork: [
      "Exploring deeper layers and wider channels to further push performance boundaries in unified visual tasks.",
      "Adapting residual skip connections to sequential models, language transformers, and audio processing networks.",
      "Automating neural architectural parameters using search algorithms to find optimal bypass connections."
    ],
    tags: ["#computer-vision", "#resnet", "#deep-learning", "#skip-connections", "#cnn"],
    confidenceScore: 5,
    readStatus: "Skim",
    createdAt: new Date("2026-06-04T09:12:00Z").toISOString(),
    notes: "Introduces ResNets. The concept of identity connections is one of the most fundamental tricks in machine learning, finding its way into transformers as residual additions."
  }
];

// Helper to load papers
function loadPapers(): any[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      return JSON.parse(data);
    } else {
      fs.writeFileSync(STORE_PATH, JSON.stringify(seedPapers, null, 2));
      return seedPapers;
    }
  } catch (e) {
    console.error("Error reading store", e);
    return seedPapers;
  }
}

// Helper to save papers
function savePapers(papers: any[]) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(papers, null, 2));
  } catch (e) {
    console.error("Error writing store", e);
  }
}

// Ensure store file is seeded on load
loadPapers();

// API: Get all archived papers
app.get("/api/papers", (req, res) => {
  const papers = loadPapers();
  res.json({ papers });
});

// API: Save or update paper
app.post("/api/papers", (req, res) => {
  const newPaper = req.body;
  if (!newPaper || !newPaper.title) {
    return res.status(400).json({ error: "Paper title is required." });
  }

  const papers = loadPapers();

  if (!newPaper.id) {
    newPaper.id = "paper_" + Date.now();
  }

  const existingIdx = papers.findIndex((p) => p.id === newPaper.id);
  if (existingIdx >= 0) {
    // Update existing paper
    papers[existingIdx] = {
      ...papers[existingIdx],
      ...newPaper,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Save as new paper
    newPaper.createdAt = new Date().toISOString();
    papers.push(newPaper);
  }

  savePapers(papers);
  res.json({ success: true, paper: newPaper });
});

// API: Delete paper
app.delete("/api/papers/:id", (req, res) => {
  const { id } = req.params;
  const papers = loadPapers();
  const filtered = papers.filter((p) => p.id !== id);
  savePapers(filtered);
  res.json({ success: true });
});

// API: Analyze Paper with Gemini API
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    // Check if key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }

    const { pdfData, paperText, customInstructions } = req.body;

    if (!pdfData && !paperText) {
      return res.status(400).json({ error: "PDF data or paper text is required." });
    }

    const systemInstruction = `You are a world-class, rigorous research assistant. Your task is to analyze research papers and extract a highly detailed and structured schematic mapping. Your work feeds directly into a researcher's Personal Knowledge Management database. Be extremely factual. Avoid generic summaries or vague generalizations. Focus on quantitative metrics, concrete methodology steps, and insightful criticisms. Keep your response strict to the provided responseSchema.`;

    const summaryPrompt = `
Analyze the attached research paper. If custom instructions are provided, prioritize adjusting your lens accordingly:
${customInstructions ? `Custom Lens / Research Focus: "${customInstructions}"` : "(No custom lens)"}

Extract the exact title, authors, year, journal details, and a high-fidelity summary template in JSON format.
In your analysis, identify limitations critically—both the explicitly stated caveats and critical unstated assumptions or potential loopholes you infer.
Produce a lists of 5-7 exact tags prefixed with '#' (e.g. #nlp, #transformers, #benchmarking).
Ensure all properties in the schema are completely matched.
    `;

    // Package contents
    let contents: any[] = [];
    if (pdfData) {
      contents.push({
        inlineData: {
          mimeType: "application/pdf",
          data: pdfData, // Base64 string from client
        },
      });
    } else {
      contents.push({
        text: `PAPER TEXT INPUT:\n\n${paperText}`,
      });
    }

    contents.push({
      text: summaryPrompt,
    });

    const config = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Official academic title of the research paper" },
          authors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of researchers/authors with clean spellings"
          },
          year: { type: Type.STRING, description: "Year of publication" },
          journal: { type: Type.STRING, description: "Journal, conference venue, or publisher" },
          oneLiner: { type: Type.STRING, description: "A single, highly impactful and memorable sentence summarizing the entire study" },
          problemStatement: { type: Type.STRING, description: "2-3 sentences explaining the specific problem, challenge or gap in prior literature" },
          coreContribution: { type: Type.STRING, description: "The novel solution, core hypothesis, or proposed framework" },
          methodology: { type: Type.STRING, description: "Detailed description of how the research, experiments, evaluations or proofs were set up" },
          keyResults: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "1-3 key quantitative or qualitative findings with concrete metrics, parameters, or outcomes"
          },
          limitations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3 key limitations: include both stated caveats and unstated weaknesses/strong assumptions you infer"
          },
          futureWork: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Future research directions suggested in the paper or inspired directly by this work"
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5-7 keywords prefixed with '#'. Keep them lowercased, succinct (e.g. #deep-learning, #cv, #nlp)"
          },
          confidenceScore: {
            type: Type.INTEGER,
            description: "Your confidence rate on a scale of 1 to 5 based on content extraction quality"
          }
        },
        required: [
          "title", "authors", "year", "journal", "oneLiner", "problemStatement", 
          "coreContribution", "methodology", "keyResults", "limitations", 
          "futureWork", "tags", "confidenceScore"
        ]
      }
    };

    console.log("Analyzing paper with Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response received from Gemini.");
    }

    const structuredData = JSON.parse(responseText.trim());
    res.json({ success: true, summary: structuredData });

  } catch (error: any) {
    console.error("Gemini paper analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze paper" });
  }
});

// API: Chat about paper (Phase 2 Active Reading Chat)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }

    const { pdfData, paperSummary, message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required." });
    }

    const systemInstruction = `You are an expert research partner and peer reviewer. You are helping the user thoroughly understand a research paper. Answer any technical, methodological, architectural, or conceptual questions they ask about the paper. Hold yourself to high academic standards. If a question cannot be answered purely using the paper, use your general expertise but explicitly mention: 'Based on the paper's broad field, ...' to clarify what is in the document versus general knowledge. Keep answers interactive, and use structured markdown, math formatting, or code spans where appropriate.`;

    const contextText = paperSummary
      ? `Here is the summary of the paper we are discussing:
Title: ${paperSummary.title}
Authors: ${paperSummary.authors?.join(", ")}
Year: ${paperSummary.year}
Journal/Venue: ${paperSummary.journal}
One-sentence summary: ${paperSummary.oneLiner}
Problem Statement: ${paperSummary.problemStatement}
Core Contribution: ${paperSummary.coreContribution}
Methodology: ${paperSummary.methodology}
Key Results:
${paperSummary.keyResults?.map((r: string) => `- ${r}`).join("\n")}
Stated & Inferred Limitations:
${paperSummary.limitations?.map((l: string) => `- ${l}`).join("\n")}
`
      : "We are discussing a research paper currently loaded.";

    // Convert past items to simple chat contents
    const contents: any[] = [];

    // Include the paper PDF direct reference if they uploaded a PDF
    if (pdfData) {
      contents.push({
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfData,
            },
          },
          {
            text: `This is the research paper we are active-reading and discussing. Please use it as the source of truth for all questions.`,
          },
        ],
      });
      // A mock model response to keep standard chat alternating model/user turns
      contents.push({
        role: "model",
        parts: [{ text: "Understood. I have locked this PDF document into my memory. Please ask anything you would like to know about its methodology, results, or implications." }],
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: `${contextText}\n\nThis is the data about the research paper we are active-reading. Let's discuss it.` }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "Got it! I am ready to help you analyze this paper. What specific aspects of the study would you like to explore?" }],
      });
    }

    // Append user chat history
    if (history && history.length > 0) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role, // "user" or "model"
          parts: [{ text: h.text }],
        });
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    console.log("Generating chat response with Gemini...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.2, // lower temperature for factual answers
      },
    });

    res.json({ success: true, response: response.text });

  } catch (error: any) {
    console.error("Gemini paper chat error:", error);
    res.status(500).json({ error: error.message || "Failed to participate in chat" });
  }
});

// Setup Vite Dev server or production static serving
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

configureServer();
