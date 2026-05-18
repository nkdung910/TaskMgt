# TaskMgt User Guide

**Version**: 1.5.0  
**Last Updated**: October 15, 2025

Welcome to TaskMgt! This guide will help you understand how to use all the features of the platform, with a special focus on the Tech News integration.

---

## 📰 Tech News Features

### Overview

TaskMgt includes a powerful tech news aggregation system that delivers personalized news based on your professional role. The system automatically fetches articles from multiple sources, scores them for relevance, and presents them in a clean, organized feed.

---

## 🎯 How News Aggregation Works

### 1. News Sources

The platform aggregates news from **10 high-quality sources**:

#### **Development-Focused Sources** (4)
- **Hacker News** - Top tech stories and discussions
- **GitHub Blog** - Latest from GitHub engineering
- **Stack Overflow Blog** - Developer insights and trends
- **DEV Community** - Community-driven developer content

#### **QA/Testing-Focused Sources** (6)
- **Ministry of Testing** - QA community and best practices
- **StickyMinds** - Software testing resources
- **Software Testing Help** - Testing tutorials and guides
- **Google Testing Blog** - Testing insights from Google
- **Test Automation University** - Automation learning platform
- **Selenium Blog** - Latest in Selenium testing

### 2. Automatic Fetching

**When Articles Are Fetched:**
- **On First Visit**: If no articles exist in the database, the system automatically fetches the latest news
- **Hourly Check**: Every time you visit after 1 hour, the system checks for new articles
- **Background Updates**: Fresh articles are fetched automatically without interrupting your work

**What You'll See:**
- 🔄 "Loading latest news articles..." - Initial fetch
- ✅ "Found X new articles!" - Successfully added new content
- ✓ "Articles are fresh" - Recently updated, no fetch needed

### 3. Article Processing

For each article fetched:
1. **Duplicate Detection**: URLs are checked to prevent duplicates
2. **Content Extraction**: Title, description, publication date, source
3. **Role Scoring**: AI analyzes content and assigns relevance scores
4. **Storage**: Article saved to database with all metadata

---

## 🤖 How the Scoring System Works

### Understanding Role Scores

Every article receives **three relevance scores** (0-100%):
- **Developer Score**: How relevant to software developers
- **QC Score**: How relevant to QA/Testing professionals
- **BA Score**: How relevant to Business Analysts

### Scoring Algorithm

The system uses **keyword-based AI scoring** with three priority levels:

#### **Step 1: Keyword Matching**

The algorithm analyzes article content (title, description, summary, tags) and counts keyword matches:

**For QC Role (Complete Keyword List):**

| Priority | Weight | Keywords | Count |
|----------|--------|----------|-------|
| **HIGH** | 15% each | testing, qa, qc, quality assurance, quality control, test automation, automated testing, manual testing, test strategy, test plan, selenium, cypress, playwright, puppeteer, webdriver, appium, jest, mocha, chai, junit, testng, pytest, rspec, cucumber, postman, rest assured, jmeter, gatling, k6, unit testing, integration testing, e2e testing, end-to-end testing, regression testing, smoke testing, sanity testing, acceptance testing, functional testing, api testing, ui testing, mobile testing, bug, defect, issue, test case, test coverage, code coverage, test suite, test framework, test data, test environment, quality metrics, defect density, test execution, test report, tester, quality engineer, qa engineer, sdet, test engineer, automation engineer, qa analyst, test lead | **54 keywords** |
| **MEDIUM** | 8% each | ci/cd, cicd, continuous testing, continuous integration, jenkins, github actions, gitlab ci, circleci, travis ci, performance testing, load testing, stress testing, scalability testing, security testing, penetration testing, vulnerability testing, code review, peer review, debugging, validation, verification, test driven development, tdd, bdd, behavior driven development, shift left testing, agile testing, devops testing, jira, testrail, zephyr, xray, qtest, browserstack, sauce labs, lambdatest | **27 keywords** |
| **LOW** | 3% each | development, feature, release, deployment, build, software | **6 keywords** |

**For Developer Role:**

| Priority | Weight | Keywords | Count |
|----------|--------|----------|-------|
| **HIGH** | 15% each | programming, code, coding, framework, library, api, sdk, typescript, javascript, python, java, react, vue, angular, node.js, nodejs, architecture, design patterns, algorithm, data structures, backend, frontend, fullstack, software engineer, developer, development, git, github, repository | **29 keywords** |
| **MEDIUM** | 8% each | devops, ci/cd, cicd, docker, kubernetes, testing framework, debugging, performance optimization, deployment, build, compiler, database, sql, mongodb, postgresql, redis | **16 keywords** |
| **LOW** | 3% each | technology, innovation, startup, product, app, application | **6 keywords** |

**For BA Role:**

| Priority | Weight | Keywords | Count |
|----------|--------|----------|-------|
| **HIGH** | 15% each | business intelligence, bi, analytics, data visualization, tableau, power bi, powerbi, dashboard, reporting, requirements, user stories, stakeholder, roi, kpi, metrics, business analyst, ba, analysis, data analysis, business requirements, functional requirements, use case | **22 keywords** |
| **MEDIUM** | 8% each | agile, scrum, kanban, jira, project management, product management, roadmap, sprint, backlog, planning, strategy, business process, workflow, process improvement | **14 keywords** |
| **LOW** | 3% each | coding, programming, technical implementation, development | **4 keywords** |

#### **Step 2: Category Boost**

Articles from specific categories get bonus points:

| Category | Boost | Description |
|----------|-------|-------------|
| **Software Testing** | +20% | Articles from testing-focused sources |
| **Quality Assurance** | +15% | QA methodology and process articles |
| **Test Automation** | +10% | Automation tools and frameworks |
| **Development** | +10% | General software development content |

#### **Step 3: Cross-Role Boosting**

If an article scores highly for one role, it gets proportional boosts for other roles:

```
If any role scores > 50%:
  - Developer gets: maxScore × 80%
  - QC gets: maxScore × 70%  
  - BA gets: maxScore × 60%

If any role scores > 30% (but ≤ 50%):
  - QC gets: maxScore × 60%
  - BA gets: maxScore × 50%
```

#### **Step 4: Minimum Baseline**

If all roles score 0%, the system provides balanced defaults:
```
Developer: 40%
QC: 30%
BA: 30%
```

**Complete Calculation Example:**
```
Article: "Test Failures Should Be Actionable"
Source: Google Testing Blog
Category: Software Testing

Step 1: Keyword Matching
HIGH matches: testing (title), test case (content), qa (tags), test execution (content), quality engineer (content), automated testing (content) = 6 × 15% = 90%
MEDIUM matches: code review (content) = 1 × 8% = 8%
LOW matches: development (content) = 1 × 3% = 3%

Initial QC Score = 90% + 8% + 3% = 101% → capped at 100%

Step 2: Category Boost
Category: "Software Testing" = +20%
QC Score = 100% + 20% = 120% → capped at 100%

Step 3: Cross-Role Boosting
Max Score = 100% (QC is highest)
Developer Score = 100% × 80% = 80%
QC Score = 100% (already highest)
BA Score = 100% × 60% = 60%

Final Scores:
✅ Developer: 80%
✅ QC: 100% ⭐
✅ BA: 60%
```

### **🔍 Understanding Your Article Scores**

**How to Interpret Scores:**

1. **Look at the highest score** - This is the article's primary relevance
2. **Check cross-role scores** - These show secondary relevance
3. **Consider the source** - Testing blogs naturally score higher for QC
4. **Read the content** - Scores reflect keyword density, not content quality

**Why Some Articles Score Lower:**

- **General tech articles**: Mix multiple topics, dilute keyword concentration
- **News articles**: Focus on announcements, not technical details
- **Opinion pieces**: Use varied terminology, fewer exact keyword matches
- **Tutorials**: May use different terms than our keyword list

**How to Get Higher Scores:**

- **Use specific terminology**: "test automation" vs "automation"
- **Include role-specific tools**: "Selenium", "Jest", "Tableau"
- **Mention processes**: "CI/CD", "agile testing", "user stories"
- **Reference methodologies**: "TDD", "BDD", "scrum"

```
If any role scores > 50%:
  - Developer gets: maxScore × 80%
  - QC gets: maxScore × 70%
  - BA gets: maxScore × 60%
```

**Example Continued:**
```
Max Score = 76% (QC)

Developer Score = 76% × 80% = 61%
QC Score = 76% (already highest)
BA Score = 76% × 60% = 46%
```

#### **Step 4: Final Scores**

```
✅ Developer: 61%
✅ QC: 76% ⭐
✅ BA: 46%
```

### Score Distribution

**Typical Score Ranges:**

| Range | Quality | Usage |
|-------|---------|-------|
| **85-100%** | Perfect match | Very rare (1% of articles) |
| **70-84%** | Highly relevant | Excellent content (9%) |
| **50-69%** | Good match | Recommended threshold (8%) |
| **30-49%** | Moderate relevance | Broader variety (13%) |
| **0-29%** | Low relevance | General tech news (68%) |

**💡 Recommendation**: Use **40-50%** minimum threshold for best balance between quality and quantity.

---

## ⚙️ Configuring News Preferences

### Accessing Settings

1. Click **Settings** in the navigation menu
2. Select **News Preferences** tab

### Setting Your Roles

**Step 1: Select Your Roles**
```
☑ Developer    (245 articles available)
☑ QC           (99 articles available)
☐ BA           (156 articles available)
```

- Select **all roles** that match your interests
- Article counts update in real-time
- More roles = more diverse content

**Step 2: Set Minimum Relevance**

Use the slider to set your quality threshold (0-85%):

```
[────●──────────] 50%
```

- **0-30%**: Maximum variety, includes general tech news
- **40-50%**: ⭐ **Recommended** - Good balance of quality and quantity
- **60-70%**: High quality, fewer articles
- **75-85%**: Only highly relevant content (very few articles)

**⚠️ Warning**: Setting above 70% may result in very few articles!

**Step 3: Save**

Click **Save Preferences** - settings apply immediately to:
- News feed
- Daily digest
- Article counts

---

## 📱 Using the News Feed

### Main News Page

**Location**: Click **News** in navigation menu

**Features:**

1. **Article Cards** show:
   - Title and source
   - Publication date
   - Description/summary
   - Role scores (color-coded)
   - Bookmark button ⭐

2. **Filtering**:
   - Articles filtered by your role preferences
   - Only shows articles ≥ your minimum relevance
   - Sorted by newest first

3. **Bookmarking**:
   - Click ⭐ to save for later
   - Access saved articles in **Bookmarks** section
   - Bookmarks are private to your account

### Reading Articles

- Click article title to open original source
- Articles open in new tab
- Your bookmarks and preferences are auto-saved

---

## 📅 How Daily Digest Works

### What is Daily Digest?

Daily Digest is a **curated selection of the most relevant articles** for you, generated automatically based on your preferences.

### Accessing Daily Digest

1. Click **News** → **Daily Digest** tab
2. Select a date from the dropdown
3. View your personalized digest

### Digest Generation

**Automatic Generation:**
```
When: First time you visit Daily Digest for "today"
What: System checks if digest exists for today
Result: 
  - If exists: Show saved digest
  - If not: Generate new digest automatically
```

**Smart Refresh:**
- Digests checked every 5 minutes
- Click **🔄 Refresh** to manually regenerate
- New articles trigger automatic regeneration

### Digest Algorithm

**Step 1: Filter Articles**
```
SELECT articles FROM today
WHERE created_at = [selected date]
  AND role_score >= 30%  (broader than news feed)
  AND matches_your_roles
ORDER BY role_score DESC
```

**Step 2: Curate Selection**
```
Pick top 20 articles that:
  ✓ Match your selected roles
  ✓ Score at least 30% for your roles
  ✓ Were added to system on selected date
  ✓ Rank highest by relevance score
```

**Step 3: Personalization**
```
If you selected: Developer + QC
  → Include articles with dev_score ≥ 30% OR qc_score ≥ 30%
  → Prioritize articles scoring high in both roles
  → Max 20 articles per digest
```

### Digest vs. News Feed

| Feature | News Feed | Daily Digest |
|---------|-----------|--------------|
| **Articles** | All matching articles | Top 20 curated |
| **Threshold** | Your setting (e.g., 50%) | 30% (more variety) |
| **Updates** | Real-time | Daily snapshots |
| **Purpose** | Browse all news | Quick daily overview |
| **Sorting** | Newest first | Highest relevance first |

### Best Practices

**For Maximum Value:**
1. ✅ Check digest daily for curated highlights
2. ✅ Use news feed for comprehensive browsing
3. ✅ Bookmark important articles
4. ✅ Adjust preferences based on article quality
5. ✅ Select multiple roles for diverse content

---

## 🎯 Tips for Getting More Relevant News

### Problem: "I see very few articles"

**Solutions:**

1. **Lower your minimum relevance threshold**
   ```
   Current: 85% → Recommended: 40-50%
   ```

2. **Select multiple roles**
   ```
   Instead of: ☑ QC only
   Try: ☑ Developer + ☑ QC + ☑ BA
   ```

3. **Check all roles to explore**
   ```
   View article counts:
   Developer: 245 articles
   QC: 99 articles
   BA: 156 articles
   ```

### Problem: "Too many low-quality articles"

**Solutions:**

1. **Increase minimum relevance**
   ```
   Current: 30% → Try: 50-60%
   ```

2. **Focus on your primary role**
   ```
   If mainly QC: Select only ☑ QC
   ```

3. **Use Daily Digest**
   ```
   Pre-filtered top 20 articles
   Saves time browsing
   ```

### Problem: "Articles not updating"

**Solutions:**

1. **Manual refresh**
   ```
   Click "Fetch Latest News" button
   ```

2. **Check last update time**
   ```
   System shows: "Last updated X minutes ago"
   Auto-updates every hour
   ```

3. **Clear browser cache**
   ```
   localStorage may need refresh
   ```

---

## 📊 Understanding Article Scores

### Score Colors

Articles display role scores with color indicators:

```
🟢 Green (70-100%): Highly relevant
🟡 Yellow (40-69%): Moderately relevant  
🔴 Red (0-39%): Low relevance
```

### Example Article Display

```
┌─────────────────────────────────────────────┐
│ 🔖 Test Failures Should Be Actionable       │
│ 📰 Google Testing Blog                      │
│ 📅 Oct 14, 2025                             │
├─────────────────────────────────────────────┤
│ Learn how to write better test failures     │
│ that help developers debug issues faster... │
├─────────────────────────────────────────────┤
│ Developer: 61% 🟡  QC: 76% 🟢  BA: 46% 🟡   │
│                                         ⭐  │
└─────────────────────────────────────────────┘
```

### Reading the Scores

**In this example:**
- **QC: 76%** 🟢 - Highly relevant for QA professionals
- **Developer: 61%** 🟡 - Moderately relevant for developers
- **BA: 46%** 🟡 - Somewhat relevant for business analysts

**Why these scores?**
- Article about "test failures" matches many QC keywords
- Relevant to developers (debugging, code quality)
- Less relevant to BA (not business-focused)

---

## 🔍 Advanced Features

### Article Search (Coming Soon)
- Search by keyword, source, or date
- Filter by specific sources
- Sort by relevance or date

### Custom Sources (Future)
- Add your own RSS feeds
- Company blogs and internal sources
- Newsletter integration

### AI Summaries (Future)
- GPT-powered article summaries
- Key takeaways extraction
- Related article recommendations

---

## ❓ Frequently Asked Questions

### **Q: How often are articles updated?**
A: The system checks for new articles every hour when you visit the news page.

### **Q: Can I see articles from previous days?**
A: Yes! Use the Daily Digest date selector to view any past day's curated articles.

### **Q: Why do some articles score high in multiple roles?**
A: Tech topics often overlap (e.g., "CI/CD testing" is relevant to both Developers and QC). The cross-role boosting algorithm ensures important articles reach multiple audiences.

### **Q: What's the difference between 50% and 70% threshold?**
A: 
- **50%**: ~58 articles - Good mix of quality and variety ⭐ Recommended
- **70%**: ~32 articles - Only highly relevant content

### **Q: Why does 100% minimum score show very few (or zero) articles?**
A: **100% is unrealistic!** Here's why:

**The Mathematics:**
```
To achieve 100% score, an article would need:
- 7 HIGH keywords (7 × 15% = 105%) → capped at 100%
  OR
- 6 HIGH keywords + Category boost (90% + 20% = 110%) → capped at 100%
```

**Reality Check:**
Most articles have only 2-4 keywords, achieving 30-60% scores.

**Current Database Statistics** (as of Oct 2025):
```
QC Role Score Distribution:
┌─────────────┬──────────┬────────┐
│ Score Range │ Articles │   %    │
├─────────────┼──────────┼────────┤
│ 100%        │    2     │  0.6%  │ ← Only 2 articles!
│ 85-99%      │    1     │  0.3%  │
│ 70-84%      │   29     │  9.3%  │
│ 50-69%      │   26     │  8.3%  │
│ 30-49%      │   41     │ 13.1%  │
│ 0-29%       │  213     │ 68.3%  │
└─────────────┴──────────┴────────┘
Total: 312 articles
```

**What This Means:**
- At **100%**: Only 2 articles available (0.6%)
- At **85%**: Only 3 articles available (1%)
- At **70%**: 32 articles available (10%)
- At **50%**: 58 articles available (19%) ⭐

**Why Articles Rarely Reach 100%:**

1. **Limited Keywords per Article**
   ```
   Average article: 2-3 HIGH keywords = 30-45%
   Good article: 4-5 HIGH keywords = 60-75%
   Perfect article: 6-7 HIGH keywords = 90-105% → capped at 100%
   ```

2. **Source Content Varies**
   - Tech blogs mix multiple topics
   - Articles often cover general development + specific QC topics
   - Pure QC-only articles are rare

3. **Natural Language Limitations**
   - Not every article uses exact keywords we track
   - Synonyms may not be detected (e.g., "quality control" vs "QA")
   - Writers vary their terminology

**Real Example - 100% Article:**
```
Title: "Test Failures Should Be Actionable"
Source: Google Testing Blog
Category: Software Testing

Keywords Found:
✓ testing (title, content) 
✓ test case (content)
✓ qa (tags)
✓ test execution (content)
✓ quality engineer (content)
✓ automated testing (content)

Score: 6 HIGH × 15% = 90%
Boost: Category "Software Testing" = +20%
Final: 90% + 20% = 110% → capped at 100% ✅

This is extremely rare!
```

**Recommended Thresholds:**

| Threshold | Articles | Use Case |
|-----------|----------|----------|
| **100%** ❌ | 2 | Too restrictive - not recommended |
| **85%** ⚠️ | 3 | Very few articles |
| **70%** ✅ | 32 | High quality only |
| **50%** ⭐ | 58 | **Best balance** - quality + variety |
| **40%** ✅ | 76 | More variety |
| **30%** ✅ | 99 | Maximum variety |

**💡 What to Do Instead:**

If you want only the best articles:
1. ✅ Set threshold to **60-70%** (not 100%)
2. ✅ Select only your primary role (e.g., QC only)
3. ✅ Use **Daily Digest** - it shows the top 20 curated articles
4. ✅ Check multiple roles if you want more content

**Why the System Caps at 85%:**
The UI slider is intentionally capped at 85% because:
- No articles in database score 86-99%
- Only 2 articles score exactly 100%
- Prevents users from setting unrealistic thresholds
- Guides users toward practical values

**Bottom Line:**
- 🚫 **Don't use 100%** - you'll see 0-2 articles
- ✅ **Use 40-60%** - you'll see 50-80 quality articles
- ⭐ **Use Daily Digest** - automatically curated top 20

### **Q: How are duplicates handled?**
A: The system checks article URLs. If the same URL exists, it won't be added again.

### **Q: Can I customize which sources to follow?**
A: Not yet, but this feature is planned for v1.6.0.

### **Q: Why does my digest show fewer than 20 articles?**
A: If fewer than 20 articles match your criteria for that day, you'll see all available articles.

### **Q: Can I export or share articles?**
A: Currently, you can bookmark articles. Export/sharing features are planned for future versions.

---

## 🚀 Quick Start Guide

### For New Users

**Step 1: Set Your Preferences** (30 seconds)
1. Go to **Settings** → **News Preferences**
2. Select your roles (e.g., ☑ Developer + ☑ QC)
3. Set minimum relevance to **50%**
4. Click **Save Preferences**

**Step 2: Browse News** (2 minutes)
1. Click **News** in navigation
2. Scroll through articles
3. Click ⭐ to bookmark interesting articles
4. Click article titles to read full content

**Step 3: Check Daily Digest** (1 minute)
1. Click **Daily Digest** tab
2. Review today's top 20 curated articles
3. Bookmark or read articles of interest

**Done!** 🎉 You're now getting personalized tech news tailored to your role.

---

**Happy reading!** 📰✨

*Last updated: October 15, 2025 - v1.5.0*

