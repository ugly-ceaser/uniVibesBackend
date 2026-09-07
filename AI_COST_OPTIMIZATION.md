# AI Chat Cost Optimization Features

## 🎯 Model Tiering Strategy

The AI Chat service implements intelligent model selection to optimize costs while maintaining response quality.

### 📊 Model Tiers

| Tier | Model | Cost per 1M tokens | Best for | Response Time |
|------|-------|-------------------|----------|---------------|
| **Fast** | gpt-3.5-turbo | ~$0.50 | Simple FAQs, quick clarifications | Fastest |
| **Balanced** | gpt-4o-mini | ~$0.15 | General questions, moderate complexity | Fast |
| **Smart** | gpt-4o | ~$2.50 | Complex reasoning, detailed analysis | Slower |

### 🧠 Automatic Task Complexity Analysis

The system automatically analyzes incoming messages to determine complexity:

- **Simple**: FAQs, basic info requests, yes/no questions
- **Moderate**: General advice, study tips, explanations  
- **Complex**: Multi-step reasoning, detailed analysis, academic planning

### 🚀 User Mode Selection

Users can override automatic selection:

```json
{
  "message": "Explain quantum mechanics",
  "userMode": "smart",  // fast | balanced | smart
  "courseId": "PHYS301",
  "context": {...}
}
```

### 💾 Intelligent Caching

**Cached Queries:**
- Course syllabi and outlines
- Assignment deadlines
- Instructor information
- Common study tips
- Library hours and campus info

**Cache Duration:** 30 minutes (configurable)
**Cache Size:** 1000 entries (LRU eviction)

### 🔄 Conversation History Optimization

- **Fast Mode**: 6 messages max
- **Balanced Mode**: 10 messages max  
- **Smart Mode**: 20 messages max

Older messages are summarized to maintain context while reducing token usage.

### 📈 Cost Tracking

Each response includes:
```json
{
  "response": "...",
  "model": "gpt-4o-mini",
  "tokensUsed": 150,
  "estimatedCost": 0.0000225,
  "cached": false
}
```

## 🛠️ Configuration

### Environment Variables

```bash
# AI Service
AI_SERVICE_URL="https://api.openai.com/v1"
AI_SERVICE_API_KEY="your-openai-api-key"

# Cost Optimization
AI_CACHE_TIMEOUT_MS=1800000        # 30 minutes
AI_MAX_CACHE_SIZE=1000             # Max cached responses
AI_DEFAULT_USER_MODE="balanced"    # Default model tier
```

### Model Costs (as of 2024)

- **gpt-3.5-turbo**: $0.50 per 1M tokens (~10x cheaper)
- **gpt-4o-mini**: $0.15 per 1M tokens (~17x cheaper)  
- **gpt-4o**: $2.50 per 1M tokens (premium)

## 💡 Usage Examples

### Course-Specific Chat (Balanced Mode)
```bash
POST /api/v1/ai/chat/course
{
  "message": "What's covered in week 3?",
  "courseId": "CS101", 
  "userMode": "balanced",
  "context": {...}
}
```

### Complex Academic Analysis (Smart Mode)
```bash  
POST /api/v1/ai/chat/academic
{
  "message": "Analyze my academic performance and create improvement plan",
  "userMode": "smart",
  "studentContext": {...}
}
```

### Quick FAQ (Fast Mode)
```bash
POST /api/v1/ai/chat/general  
{
  "message": "When is the library open?",
  "userMode": "fast"
}
```

## 📊 Expected Cost Savings

- **Simple queries**: 90% cost reduction (fast vs smart)
- **Cached responses**: 100% cost reduction 
- **Optimized history**: 30-50% token reduction
- **Smart routing**: 60% average cost reduction

## 🎛️ Advanced Features

### Batch Processing (Future)
Cache common course summaries and serve multiple users.

### Embedding-Based Memory (Future)  
Use cheaper embedding models for context search before calling chat models.

### Usage Analytics
Track costs per user, per course, and per query type for optimization.

## 🔧 Monitoring

Monitor these metrics:
- Average tokens per request
- Cache hit rate  
- Cost per user/day
- Model distribution usage
- Response time by tier

The system automatically logs cost and usage data for analysis and optimization.