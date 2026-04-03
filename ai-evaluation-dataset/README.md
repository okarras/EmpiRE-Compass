# AI Evaluation Dataset

Download academic papers from ORKG and evaluate the AI questionnaire assistant against ground truth.

## 1. Download Dataset

```bash
cd ai-evaluation-dataset
pip install -r requirements.txt
echo "UNPAYWALL_EMAIL=your.email@example.com" >> .env
python scripts/generate_dataset.py --limit 10
```

Retry failed PDFs:

```bash
python scripts/retry_failed_pdfs.py
```

## 2. Start Backend

```bash
cd backend
npm install
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
npm run dev
```

Verify: `curl http://localhost:5001/api/health`

## 3. Run Evaluation

```bash
cd ai-evaluation-dataset/scripts/frontend-exact
npm install
npm run build
node dist/index.js --limit 10 --dataset ../../dataset
```

Options:

```
--dataset PATH      Path to dataset directory
--limit N           Evaluate only N papers
--offset N          Skip first N papers
--model NAME        Override AI model (e.g. gpt-4o-mini, gpt-3.5-turbo)
--model-tag TAG     Tag for output file naming
--with-context      Include sibling ground truth as context
--backend URL       Backend URL (default: http://localhost:5001)
--test              Test backend connectivity only
```

## 4. Post-Processing Pipeline

```bash
# Step 1: Recompute all metrics (BERTScore + SBERT + boolean normalization)
python3 rescore-all.py results-*.json

# Step 2: Fair matching for repeat-text questions
python3 standalone-fair-rescore.py

# Step 3: Compare models
python3 compare.py

# Step 4: Export to Excel
python3 export-excel.py
```

## 5. View Results

```bash
cat results-*-final.json | jq '.summary'
```

## Cost Estimates

| Model         | 1 paper | 10 papers | 50 papers | 200 papers |
| ------------- | ------- | --------- | --------- | ---------- |
| GPT-3.5-turbo | ~$0.01  | ~$0.10    | ~$0.50    | ~$2.00     |
| GPT-4o-mini   | ~$0.02  | ~$0.20    | ~$1.00    | ~$4.00     |
