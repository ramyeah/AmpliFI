// constants/modules.js
// Content block types:
// { type: 'text', text: '' }
// { type: 'keyterm', term: '', definition: '' }
// { type: 'table', headers: [], rows: [[]] }          ← renders as ComparisonCards
// { type: 'steps', title: '', steps: [] }             ← tap to reveal one by one
// { type: 'callout', variant: 'tip'|'warning'|'fact', text: '' }
// { type: 'bullets', title: '', items: [] }
// { type: 'bot', label: '', prompt: '' }              ← inline RAG bot chip
// { type: 'mcq', icon, title, question, options, correctIndex, explanation }
// { type: 'truefalse', icon, title, statements: [{text, isTrue, explanation}] }
// { type: 'slider', icon, title, description, min, max, step, initialValue, prefix, calculateResult }
// { type: 'match', icon, title, instruction, pairs: [{left, right}] }
// { type: 'fillblank', icon, title, prompt, blanks: [{placeholder, answer}], hint }

export const MODULES = [
  // ═══════════════════════════════════════════
  // MODULE 1 — Money Foundations
  // ═══════════════════════════════════════════
  {
    id: 'module-1',
    title: 'Money Foundations',
    description: 'Build the mindset and habits that make everything else possible',
    icon: '🌱',
    color: '#4F46E5',
    colorLight: '#EEF2FF',
    chapters: [

      // ─── CHAPTER 1: Understanding Money & Mindset ───
      {
        id: 'chapter-1',
        title: 'Understanding Money & Mindset',
        icon: '🧠',
        description: 'Why money mindset matters and how to build a healthy one',
        lessons: [

          // ── LESSON 1-1 ──────────────────────────────
          {
            id: '1-1',
            title: 'What is Financial Literacy?',
            icon: '📚',
            topic: 'Financial literacy definition and importance',
            duration: '5 min',
            xp: 50,
            sections: [
              { key: 'definition', heading: 'What Financial Literacy Actually Means' },
              { key: 'why', heading: 'Why It Matters in Singapore' },
              { key: 'bigthree', heading: 'The Big Three Concepts' },
            ],
            content: [
              {
                type: 'text',
                text: 'Financial literacy is your ability to understand and apply financial concepts in real life — not just knowing what "compound interest" means, but actually using that knowledge to make better decisions.',
              },
              {
                type: 'keyterm',
                term: 'Financial Literacy',
                definition: 'The knowledge, skills, and confidence to make informed financial decisions about budgeting, saving, investing, and managing debt.',
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'Only 59% of Singaporeans are considered financially literate — and among university students, the rate is even lower despite having higher education levels.',
              },
              {
                type: 'bullets',
                title: 'Financially literate people are better at:',
                items: [
                  'Building emergency funds before they need them',
                  'Avoiding high-interest debt traps',
                  'Making their money grow through investments',
                  'Planning for major life expenses (housing, retirement)',
                  'Recovering from unexpected financial shocks',
                ],
              },
              {
                type: 'bot',
                label: '💬 Live stat: Singapore financial literacy rate',
                prompt: 'Singapore financial literacy rate survey statistics percentage',
              },
              {
                type: 'text',
                text: 'Researchers use three questions — called the "Big Three" — as an internationally validated benchmark for financial literacy. They test compound interest, inflation, and risk diversification.',
              },
              {
                type: 'timeline',
                title: 'The Big Three financial literacy concepts:',
                nodes: [
                  {
                    icon: '①',
                    label: 'Compound Interest',
                    sublabel: 'Does money grow faster?',
                    color: '#4F46E5',
                    examples: ['Savings accounts', 'Investments', 'Loans'],
                    details: [
                      'Money earns returns not just on the principal, but on previous returns too.',
                      'The longer you invest, the more powerful the effect becomes.',
                      'Affects how you think about savings accounts, loans, and investments.',
                    ],
                    tip: '$1,000 at 5% p.a. compound interest becomes $1,629 after 10 years — without adding a single dollar.',
                  },
                  {
                    icon: '②',
                    label: 'Inflation',
                    sublabel: 'Does money lose value?',
                    color: '#F59E0B',
                    examples: ['Groceries cost more', 'Rent rises', 'Purchasing power drops'],
                    details: [
                      'Inflation means the same $10 buys less next year than it does today.',
                      'Singapore\'s average inflation rate is around 2–3% per year.',
                      'Money sitting in a 0.05% savings account is losing real value every year.',
                    ],
                    tip: 'If inflation is 3% and your savings earn 0.05%, you\'re losing 2.95% of purchasing power every year.',
                  },
                  {
                    icon: '③',
                    label: 'Risk Diversification',
                    sublabel: 'Does spreading reduce risk?',
                    color: '#059669',
                    examples: ['Stocks + bonds', 'ETFs', 'Multiple asset classes'],
                    details: [
                      'Putting all your money in one asset means one bad event wipes everything out.',
                      'Spreading across different assets smooths out losses.',
                      'A diversified portfolio loses less in a crash and recovers faster.',
                    ],
                    tip: 'An S&P 500 ETF instantly diversifies you across 500 companies — one purchase, instant diversification.',
                  },
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'In Singapore, only 40% of adults can correctly answer all three Big Three questions. Completing this course puts you ahead of the majority.',
              },
              {
                type: 'text',
                text: 'Now test yourself on all three Big Three concepts — the same questions used in international financial literacy surveys.',
              },
              {
                type: 'multistepmcq',
                icon: '🏆',
                title: 'The Big Three Challenge',
                questions: [
                  {
                    concept: 'Compound Interest',
                    question: 'You invest $1,000 at 5% compound interest per year. After 2 years, you have:',
                    options: ['$1,050', '$1,100', '$1,102.50', '$1,025'],
                    correctIndex: 2,
                    explanation: 'Year 1: $1,000 × 5% = $50 → $1,050. Year 2: $1,050 × 5% = $52.50 → $1,102.50. Compound interest earns returns on previous returns.',
                  },
                  {
                    concept: 'Inflation',
                    question: 'Inflation is running at 3% per year. Your savings account pays 1% per year. After one year, your purchasing power has:',
                    options: ['Increased by 1%', 'Stayed the same', 'Decreased by 2%', 'Decreased by 3%'],
                    correctIndex: 2,
                    explanation: 'Real return = interest rate − inflation = 1% − 3% = −2%. Your money grows nominally but buys less in real terms.',
                  },
                  {
                    concept: 'Risk Diversification',
                    question: 'You invest all your savings in one company\'s stock. That company goes bankrupt. Compared to a diversified portfolio, you have:',
                    options: [
                      'Lost the same amount',
                      'Lost more — concentration risk amplified your loss',
                      'Lost less — single stock is easier to monitor',
                      'It makes no difference',
                    ],
                    correctIndex: 1,
                    explanation: 'Diversification spreads risk — if one asset fails, others cushion the blow. Putting everything in one stock means one bad event wipes out everything.',
                  },
                ],
              },
            ],
            flashcards: [
              { q: 'What percentage of Singaporeans are financially literate?', a: 'Around 59% — but only 40% can correctly answer all three Big Three questions.' },
              { q: 'What are the Big Three financial literacy concepts?', a: 'Compound interest, inflation, and risk diversification.' },
              { q: 'Why does financial literacy matter for university students specifically?', a: 'University is often the first time students make independent financial decisions — habits formed now last a lifetime.' },
              { q: 'What is financial literacy in one sentence?', a: 'The knowledge and confidence to make sound decisions about money — budgeting, saving, investing, and managing debt.' },
              { q: 'What is the difference between financial knowledge and financial literacy?', a: 'Knowledge is knowing the concepts; literacy includes the skill and confidence to actually apply them.' },
            ],
          },

          // ── LESSON 1-2 ──────────────────────────────
          {
            id: '1-2',
            title: 'Your Money Mindset',
            icon: '🧩',
            topic: 'Money mindset and psychological relationship with money',
            duration: '6 min',
            xp: 50,
            sections: [
              { key: 'mindset', heading: 'Fixed vs Growth Money Mindset' },
              { key: 'biases', heading: 'Common Financial Biases' },
              { key: 'habits', heading: 'Building Positive Money Habits' },
            ],
            content: [
              {
                type: 'text',
                text: 'How you think about money shapes every financial decision you make. Two people earning the same salary can end up in completely different financial positions — the difference is mindset and habits.',
              },
              {
                type: 'text',
                text: 'Tap each card to see how a fixed money mindset can be reframed into a growth one.',
              },
              {
                type: 'flipcards',
                title: 'Fixed → Growth Mindset',
                cards: [
                  {

                    front: '"I\'m just not good with money."',
                    back: '"I can learn to manage money better — it\'s a skill, not a talent."',
                  },
                  {
                    front: '"Investing is too risky for me."',
                    back: '"I can learn to manage risk through diversification and time."',
                  },
                  {
                    front: '"I\'ll start saving when I earn more."',
                    back: '"I start saving a small amount now and build the habit."',
                  },
                  {
                    front: '"Rich people are just lucky."',
                    back: '"Financial success is learnable — habits and decisions compound over time."',
                  },
                ],
              },
              {
                type: 'text',
                text: 'Beyond mindset, our brains are wired with cognitive shortcuts called biases — and they quietly sabotage financial decisions every day. Swipe through the five most common ones.',
              },
              {
                type: 'biasreveal',
                title: 'The five biases that hurt your finances:',
                biases: [
                  {
                    icon: '🎯',
                    name: 'Present Bias',
                    color: '#4F46E5',
                    tagline: 'Valuing today\'s $100 more than tomorrow\'s $200',
                    definition: 'We instinctively prefer immediate rewards over future ones — even when the future reward is objectively better. This makes saving feel pointless and spending feel urgent.',
                    example: '"I\'ll save next month when I have more money" — said every month, indefinitely.',
                    singaporeTip: 'Flash sales on Shopee and Lazada are designed to trigger present bias — the countdown timer makes the immediate reward feel even more urgent.',
                  },
                  {
                    icon: '🐑',
                    name: 'Herd Mentality',
                    color: '#F59E0B',
                    tagline: 'Doing what everyone else is doing with money',
                    definition: 'We take financial cues from the crowd — assuming that if everyone is buying something, it must be a good decision. This leads to buying high and selling low.',
                    example: 'Buying crypto in 2021 because "everyone is making money" — right before the crash.',
                    singaporeTip: 'Singapore\'s property obsession is partly herd mentality — "everyone buys HDB" is a social norm, not always the best financial decision for every person.',
                  },
                  {
                    icon: '😨',
                    name: 'Loss Aversion',
                    color: '#DC2626',
                    tagline: 'The pain of losing feels twice as bad as the joy of gaining',
                    definition: 'Losing $100 feels roughly twice as painful as gaining $100 feels good. This asymmetry leads to panic selling during market dips and holding bad investments too long.',
                    example: 'Selling all your investments when the market drops 10% — locking in a loss right before recovery.',
                    singaporeTip: 'CPF interest is guaranteed — loss aversion makes people irrationally afraid of investing CPF-IS funds, even when expected returns are higher.',
                  },
                  {
                    icon: '🙈',
                    name: 'Ostrich Effect',
                    color: '#059669',
                    tagline: 'Avoiding financial information when it might be bad',
                    definition: 'Like an ostrich burying its head, we avoid checking bank balances, credit card statements, or investment portfolios when we suspect bad news. Avoidance feels like relief but makes problems worse.',
                    example: 'Not opening your credit card statement because you overspent last month.',
                    singaporeTip: 'Use MyInfo or Singpass Finance to see all accounts in one place — visibility removes the temptation to avoid.',
                  },
                  {
                    icon: '💳',
                    name: 'Payment Decoupling',
                    color: '#7C3AED',
                    tagline: 'Digital payments feel less real than cash',
                    definition: 'When payment is separated from the act of spending — by time, abstraction, or technology — it reduces the psychological "pain of paying". This makes overspending much easier.',
                    example: 'Spending $400 on a credit card feels less painful than handing over $400 in cash.',
                    singaporeTip: 'PayNow, GrabPay, and NETS make Singapore almost cashless — convenient but dangerous without a budget. You never feel the money leaving.',
                  },
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: PayNow and e-wallets make payment decoupling especially dangerous — it\'s easy to lose track of spending when you never physically hand over cash.',
              },
              {
                type: 'text',
                text: 'Knowing the names isn\'t enough — you need to recognise biases in the moment. Pick your reaction to each scenario below to see which bias is at play.',
              },
              {
                type: 'scenarios',
                title: 'Which bias is driving this?',
                scenarios: [
                  {
                    icon: '💰',
                    situation: 'You receive a $500 bonus. There\'s a sale on Shopee ending tonight. What do you do?',
                    options: [
                      {
                        text: 'Transfer $400 to savings, spend $100 guilt-free.',
                        biasLabel: 'Rational choice ✓',
                        biasExplanation: 'You resisted present bias — paying future-you first before spending.',
                        isIdeal: true,
                      },
                      {
                        text: 'Browse Shopee — it\'s a limited time deal, can\'t miss it.',
                        biasLabel: 'Present Bias',
                        biasExplanation: 'Valuing an immediate reward (the sale) more than the future benefit of saving.',
                        isIdeal: false,
                      },
                      {
                        text: 'Spend most of it — you deserve a treat after working hard.',
                        biasLabel: 'Present Bias',
                        biasExplanation: 'Framing present spending as deserved makes it easier to justify — but the future cost is real.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '📱',
                    situation: 'Everyone in your friend group is buying the new iPhone. Your current phone works fine.',
                    options: [
                      {
                        text: 'Buy it — you don\'t want to be the only one without it.',
                        biasLabel: 'Herd Mentality',
                        biasExplanation: 'Making financial decisions based on what others do rather than your own needs.',
                        isIdeal: false,
                      },
                      {
                        text: 'Keep your current phone — it works, and you have savings goals.',
                        biasLabel: 'Rational choice ✓',
                        biasExplanation: 'You separated social pressure from financial need — a key financial literacy skill.',
                        isIdeal: true,
                      },
                      {
                        text: 'Put it on credit card — everyone else has it.',
                        biasLabel: 'Herd Mentality + Debt Risk',
                        biasExplanation: 'Herd mentality amplified by payment decoupling — the credit card makes the purchase feel less real.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '📉',
                    situation: 'Your investment drops 10% in a week. The market has been volatile.',
                    options: [
                      {
                        text: 'Sell everything — I can\'t bear to lose more.',
                        biasLabel: 'Loss Aversion',
                        biasExplanation: 'The pain of a 10% loss feels bigger than the potential of recovery — leading to panic selling at the worst time.',
                        isIdeal: false,
                      },
                      {
                        text: 'Check my investment thesis — if nothing changed, hold or buy more.',
                        biasLabel: 'Rational choice ✓',
                        biasExplanation: 'Short-term volatility is normal. Long-term investors who hold through dips consistently outperform panic sellers.',
                        isIdeal: true,
                      },
                      {
                        text: 'Avoid checking my portfolio at all.',
                        biasLabel: 'Ostrich Effect',
                        biasExplanation: 'Avoiding information doesn\'t change reality — and may cause you to miss rebalancing opportunities.',
                        isIdeal: false,
                      },
                    ],
                  },
                ],
              },
              {
                type: 'text',
                text: 'Once you recognise these biases, the next step is building habits that work with your brain — not against it. The habit loop is the proven framework for making any financial behaviour automatic.',
              },
              {
                type: 'timeline',
                title: 'The habit loop — how financial habits form:',
                nodes: [
                  {
                    icon: '🔔',
                    label: 'Cue',
                    sublabel: 'The trigger',
                    color: '#4F46E5',
                    examples: ['Salary credit alert', 'Calendar reminder', 'App notification'],
                    details: [
                      'Link saving to an existing trigger — a salary credit notification is ideal.',
                      'The cue must be consistent and automatic to build a reliable habit.',
                    ],
                    tip: 'Every time you receive a salary credit alert, that\'s your cue to transfer 20% to savings.',
                  },
                  {
                    icon: '⚙️',
                    label: 'Routine',
                    sublabel: 'The behaviour',
                    color: '#F59E0B',
                    examples: ['Bank transfer', 'GIRO instruction', 'Auto-debit'],
                    details: [
                      'Keep the routine simple and frictionless — a single bank transfer takes 10 seconds.',
                      'Automate it where possible so it doesn\'t rely on willpower.',
                    ],
                    tip: 'Set up a standing GIRO instruction so the transfer happens automatically on salary day.',
                  },
                  {
                    icon: '🎁',
                    label: 'Reward',
                    sublabel: 'What makes it stick',
                    color: '#059669',
                    examples: ['Savings balance grows', 'Milestone badges', 'Progress tracker'],
                    details: [
                      'Track your growing savings balance — visible progress is its own reward.',
                      'Small celebrations at milestones ($500, $1,000) reinforce the loop.',
                    ],
                    tip: 'Open your savings app after every transfer and watch the balance grow — that number is your reward.',
                  },
                ],
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'Research shows it takes an average of 66 days to form a new financial habit — not 21 days as commonly believed.',
              },
              {
                type: 'bot',
                label: '💬 What percentage of Singaporeans have positive financial habits?',
                prompt: 'percentage of Singaporeans with positive saving and financial habits MoneySense survey',
              },
              {
                type: 'text',
                text: 'Now test your understanding of the money mindset concepts covered in this lesson.',
              },
              {
                type: 'tindertruefalse',
                title: 'Money Mindset Myths',
                instruction: 'Swipe right for True · Swipe left for False',
                statements: [
                  {
                    text: 'You need to earn a lot before budgeting is worth doing.',
                    isTrue: false,
                    explanation: 'Budgeting is most important when income is limited — it helps you make the most of every dollar.',
                  },
                  {
                    text: 'Payment decoupling means digital spending feels less real than cash.',
                    isTrue: true,
                    explanation: 'Studies confirm card/digital payments reduce the "pain of paying" — making overspending easier.',
                  },
                  {
                    text: 'Loss aversion means people fear losses more than they value equivalent gains.',
                    isTrue: true,
                    explanation: 'Losing $100 feels roughly twice as bad as gaining $100 feels good — a key insight from behavioural economics.',
                  },
                  {
                    text: 'It takes exactly 21 days to form a new habit.',
                    isTrue: false,
                    explanation: 'Research shows it takes an average of 66 days — the 21-day myth is a popular misconception.',
                  },
                ],
              },
            ],
            flashcards: [
              { q: 'What is present bias in personal finance?', a: 'Valuing immediate rewards over future gains — e.g. spending today instead of saving for tomorrow.' },
              { q: 'What is the habit loop for building money habits?', a: 'Cue → Routine → Reward → Repeat. Attach saving to an existing trigger like salary credit.' },
              { q: 'How does payment decoupling affect spending in Singapore?', a: 'Digital payments (PayNow, cards) feel less "real" than cash, making it easier to overspend.' },
              { q: 'What is loss aversion?', a: 'The pain of losing money feels stronger than the joy of gaining the same amount — leading to overly risk-averse or panic-driven decisions.' },
              { q: 'What is the difference between fixed and growth money mindset?', a: 'Fixed: "I\'m bad with money." Growth: "I can learn to manage money better." Growth mindset leads to better outcomes.' },
            ],
          },

          // ── LESSON 1-3 ──────────────────────────────
          {
            id: '1-3',
            title: 'Setting Financial Goals',
            icon: '🎯',
            topic: 'Setting SMART financial goals',
            duration: '5 min',
            xp: 50,
            sections: [
              { key: 'why', heading: 'Why Goals Change Financial Behaviour' },
              { key: 'smart', heading: 'SMART Financial Goals' },
              { key: 'singapore', heading: 'Common Goals for Students in Singapore' },
            ],
            content: [
              {
                type: 'text',
                text: 'People with written financial goals save significantly more and accumulate more wealth than those without. A goal gives every dollar a purpose.',
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'A Harvard study found that people who write down their goals are 42% more likely to achieve them than those who don\'t.',
              },
              {
                type: 'keyterm',
                term: 'SMART Goals',
                definition: 'Specific, Measurable, Achievable, Relevant, Time-bound — a framework for setting goals that actually get done.',
              },
              {
                type: 'text',
                text: 'Most financial goals fail because they\'re too vague. Swipe through the cards below to see how weak goals get transformed into SMART ones.',
              },
              {
                type: 'flipcards',
                title: 'Vague → SMART Goals',
                cards: [
                  {
                    frontLabel: '❌ Vague',
                    backLabel: '✅ SMART',
                    front: '"Save more money"',
                    back: '"Save $500/month for 6 months to build a $3,000 emergency fund by June 2025."',
                    tag: 'Specific + Measurable + Time-bound',
                  },
                  {
                    frontLabel: '❌ Vague',
                    backLabel: '✅ SMART',
                    front: '"Invest someday"',
                    back: '"Invest $200/month into an STI ETF starting January, via a robo-advisor."',
                    tag: 'Achievable + Relevant + Time-bound',
                  },
                  {
                    frontLabel: '❌ Vague',
                    backLabel: '✅ SMART',
                    front: '"Pay off debt"',
                    back: '"Clear my $3,000 credit card balance by December by paying $300/month."',
                    tag: 'Specific + Measurable + Time-bound',
                  },
                  {
                    frontLabel: '❌ Vague',
                    backLabel: '✅ SMART',
                    front: '"Build emergency fund"',
                    back: '"Save $3,700 in a separate OCBC 360 account by June 2025 — $310/month."',
                    tag: 'All five SMART criteria met',
                  },
                ],
              },
              {
                type: 'text',
                text: 'Now test yourself — swipe right if the goal is SMART, left if it\'s not. Look for the five SMART criteria: Specific, Measurable, Achievable, Relevant, Time-bound.',
              },
              {
                type: 'tindertruefalse',
                title: 'Is it SMART?',
                instruction: 'Swipe right if SMART · Swipe left if Not SMART',
                statements: [
                  { text: '"I want to save $500 every month for 12 months to build a $6,000 emergency fund by December 2025."', isTrue: true, explanation: 'Specific ($500/month), Measurable ($6,000), Achievable, Relevant (emergency fund), Time-bound (December 2025).' },
                  { text: '"I want to be rich one day."', isTrue: false, explanation: 'Not specific, not measurable, no timeframe — there\'s no way to know if you\'re making progress.' },
                  { text: '"I will invest $100/month into a robo-advisor starting next month."', isTrue: true, explanation: 'Specific ($100/month, robo-advisor), Measurable, Achievable, Relevant, Time-bound (next month).' },
                  { text: '"I\'ll try to spend less on food."', isTrue: false, explanation: 'Not specific — how much less? By when? On what? Without numbers it\'s just a wish.' },
                  { text: '"I will clear my $1,200 credit card debt in 6 months by paying $200/month."', isTrue: true, explanation: 'All five criteria met — specific amount, measurable monthly payment, achievable timeframe, clearly relevant, time-bound.' },
                  { text: '"I want to save a lot before graduation."', isTrue: false, explanation: '"A lot" is not measurable and "before graduation" is vague — it needs a specific dollar amount and date. Try: "Save $4,000 by May 2026 — $200/month for 20 months."' },
                ],
              },
              {
                type: 'text',
                text: 'Now make it personal. Tap the financial goals below that are relevant to you — each one will show you a realistic monthly saving target.',
              },
              {
                type: 'bot',
                label: '💬 What is the average cost of living for students in Singapore?',
                prompt: 'average monthly cost of living international student Singapore university 2024',
              },
              {
                type: 'goalpicker',
                title: 'What are your financial goals? 🎯',
                goals: [
                  {
                    icon: '🛡️',
                    label: 'Build a 3-month emergency fund',
                    monthlySaving: 200,
                    months: 18,
                    tip: 'Keep this in a separate OCBC 360 or UOB One account — not your daily account.',
                  },
                  {
                    icon: '✈️',
                    label: 'Save for a flight home this semester break',
                    monthlySaving: 150,
                    months: 4,
                    tip: 'Budget $600–$800 for a return flight to most Southeast Asian destinations.',
                  },
                  {
                    icon: '💻',
                    label: 'Buy a new laptop without going into debt',
                    monthlySaving: 120,
                    months: 10,
                    tip: 'A solid mid-range laptop (e.g. MacBook Air M2) costs around $1,200–$1,500 in Singapore.',
                  },
                  {
                    icon: '🎓',
                    label: 'Graduate with zero credit card debt',
                    monthlySaving: 100,
                    months: 12,
                    tip: 'If you already have credit card debt, prioritise clearing it — 26.9% p.a. interest grows fast.',
                  },
                  {
                    icon: '📈',
                    label: 'Start investing $100–$200/month by Year 3',
                    monthlySaving: 150,
                    months: 24,
                    tip: 'Start with a robo-advisor (Syfe, StashAway) — low minimums, auto-diversified, no expertise needed.',
                  },
                  {
                    icon: '🏠',
                    label: 'Understand CPF before entering the workforce',
                    monthlySaving: 0,
                    months: 0,
                    tip: 'No saving needed — just complete Module 4 of AmpliFI before graduation. Knowledge is free.',
                  },
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: As an international student, you won\'t contribute to CPF while studying — but understanding it now means you\'re ready the moment you start working here.',
              },
            ],
            flashcards: [
              { q: 'What does SMART stand for in goal-setting?', a: 'Specific, Measurable, Achievable, Relevant, Time-bound.' },
              { q: 'Why is having a written financial goal important?', a: 'Written goals are 42% more likely to be achieved — they give every spending decision a purpose.' },
              { q: 'What is a reasonable emergency fund target for a student in Singapore?', a: '$3,000–$6,000 — roughly 3 months of living expenses.' },
              { q: 'Convert this to a SMART goal: "I want to save money"', a: '"I will save $500/month for 6 months to build a $3,000 emergency fund by June 2025."' },
              { q: 'When should international students start learning about CPF?', a: 'Before graduation — so they\'re ready to maximise contributions from their first paycheck.' },
            ],
          },
        ],
      },

      // ─── CHAPTER 2: Budgeting ────────────────────────
      {
        id: 'chapter-2',
        title: 'Budgeting',
        icon: '📊',
        description: 'Track, plan, and control your money every month',
        lessons: [

          // ── LESSON 2-1 ──────────────────────────────
          {
            id: '2-1',
            title: 'Why Budgeting Works',
            icon: '📋',
            topic: 'Budgeting fundamentals and why it changes financial outcomes',
            duration: '5 min',
            xp: 60,
            sections: [
              { key: 'what', heading: 'What a Budget Actually Is' },
              { key: 'why', heading: 'Why Most Students Don\'t Budget' },
              { key: 'benefits', heading: 'What Changes When You Budget' },
            ],
            content: [
              {
                type: 'text',
                text: 'A budget is simply a plan for your money — telling each dollar where to go before the month starts, rather than wondering where it went after.',
              },
              {
                type: 'keyterm',
                term: 'Budget',
                definition: 'A forward-looking plan that allocates your income across spending categories, savings, and debt repayment for a set time period.',
              },
              {
                type: 'text',
                text: 'Most students avoid budgeting — but the reasons they give don\'t hold up. Swipe through to see each excuse reframed.',
              },
              {
                type: 'flipcards',
                title: 'Budgeting Excuses → Reality',
                cards: [
                  {
                    frontLabel: '❌ Excuse',
                    backLabel: '✅ Reality',
                    front: '"My income is irregular — budgeting won\'t work for me."',
                    back: '"Budget based on your lowest expected income month. Any extra is a bonus to save."',
              
                  },
                  {
                    frontLabel: '❌ Excuse',
                    backLabel: '✅ Reality',
                    front: '"Budgeting is too restrictive — I\'ll feel deprived."',
                    back: '"A budget includes a Wants category. It gives you guilt-free permission to spend — within a set amount."',
                  },
                  {
                    frontLabel: '❌ Excuse',
                    backLabel: '✅ Reality',
                    front: '"I don\'t earn enough to need a budget."',
                    back: '"Budgeting is most important when money is tight — it makes every dollar work harder."',
                  },
                  {
                    frontLabel: '❌ Excuse',
                    backLabel: '✅ Reality',
                    front: '"I\'ll start budgeting when I have a real job."',
                    back: '"Habits form now. Students who budget in university carry the habit into their careers."',
                  },
                  {
                    frontLabel: '❌ Excuse',
                    backLabel: '✅ Reality',
                    front: '"It takes too much time."',
                    back: '"A weekly 5-minute review is all it takes. Modern apps like Planner Bee make it automatic."',
                  },
                ],
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'A NUS study found that 68% of students in Singapore exceed their monthly budget regularly — but fewer than 20% track their spending.',
              },
              {
                type: 'text',
                text: 'The difference between budgeting and not budgeting isn\'t just about money — it\'s about control, clarity, and confidence. Tap each item below to unlock what changes.',
              },
              {
                type: 'checklist',
                title: 'What changes when you budget:',
                items: [
                  '🛑 You stop running out of money before month-end',
                  '🔍 You find "hidden" spending you didn\'t notice',
                  '⚖️ You make intentional trade-offs instead of impulse decisions',
                  '💰 You build savings consistently instead of saving "whatever is left"',
                  '😌 You feel less financial anxiety — you know your numbers',
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: GrabFood, Shopee, and Lazada purchases are the biggest budget-busters for students here. Seeing the monthly total in one place is a wake-up call.',
              },
              {
                type: 'bot',
                label: '💬 What are the biggest spending categories for students in Singapore?',
                prompt: 'biggest spending categories monthly expenses university students Singapore 2024',
              },
              {
                type: 'text',
                text: 'Budgeting looks different in practice for everyone. See which of these real-life scenarios you recognise.',
              },
              {
                type: 'scenarios',
                title: 'Budgeting in real life',
                scenarios: [
                  {
                    icon: '🛒',
                    situation: 'It\'s the 25th of the month and you have $80 left. Your friend invites you to a $60 dinner. What do you do?',
                    options: [
                      {
                        text: 'Go — you only live once, you\'ll figure it out.',
                        biasLabel: 'Present Bias',
                        biasExplanation: 'Spending without knowing if you can cover essentials for the remaining week is a classic present-bias decision.',
                        isIdeal: false,
                      },
                      {
                        text: 'Check your budget — can essentials for the rest of the month be covered with $20?',
                        biasLabel: 'Rational choice ✓',
                        biasExplanation: 'Knowing your numbers lets you make an informed yes or no — guilt-free either way.',
                        isIdeal: true,
                      },
                      {
                        text: 'Decline without checking — you assume you can\'t afford it.',
                        biasLabel: 'Overcautious',
                        biasExplanation: 'Not tracking spending means you can\'t make confident decisions — you miss out unnecessarily.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '📱',
                    situation: 'Your Shopee cart has $120 of items. It\'s the end of a 12.12 sale. You haven\'t checked your spending this month.',
                    options: [
                      {
                        text: 'Checkout — it\'s a sale, prices won\'t be this low again.',
                        biasLabel: 'Scarcity Bias + Impulse Spend',
                        biasExplanation: 'Sales create artificial urgency. Without knowing your monthly total, this could push you into deficit.',
                        isIdeal: false,
                      },
                      {
                        text: 'Check your Wants budget first — if there\'s room, buy guiltlessly.',
                        biasLabel: 'Rational choice ✓',
                        biasExplanation: 'A budget tells you exactly how much discretionary spending you have left — so you can say yes confidently.',
                        isIdeal: true,
                      },
                      {
                        text: 'Put it on credit card — pay later.',
                        biasLabel: 'Payment Decoupling',
                        biasExplanation: 'Credit cards decouple the pain of payment — making it easy to overspend and pay interest later.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '💸',
                    situation: 'Your tuition allowance just came in — $1,500 for the month. You feel rich. What\'s your first move?',
                    options: [
                      {
                        text: 'Treat yourself — you\'ve been waiting for this.',
                        biasLabel: 'Windfall Effect',
                        biasExplanation: 'Lump sum income feels like "extra" money — but it needs to cover the entire month.',
                        isIdeal: false,
                      },
                      {
                        text: 'Transfer savings first, then allocate the rest across categories.',
                        biasLabel: 'Rational choice ✓',
                        biasExplanation: 'Pay yourself first before discretionary spending — this is the core habit of effective budgeters.',
                        isIdeal: true,
                      },
                      {
                        text: 'Wait and see how much is left at the end of the month.',
                        biasLabel: 'Passive approach',
                        biasExplanation: '"Save what\'s left" rarely works — there\'s usually nothing left. Planning forward changes outcomes.',
                        isIdeal: false,
                      },
                    ],
                  },
                ],
              },
              {
                type: 'text',
                text: 'Finally, test your understanding — swipe right for True, left for False.',
              },
              {
                type: 'tindertruefalse',
                title: 'Budgeting Myths',
                instruction: 'Swipe right for True · Swipe left for False',
                statements: [
                  {
                    text: 'A budget restricts you from enjoying life.',
                    isTrue: false,
                    explanation: 'A budget includes a Wants category — it gives you guilt-free permission to spend within a set amount.',
                  },
                  {
                    text: 'Tracking spending alone can reduce discretionary expenses by 15–20%.',
                    isTrue: true,
                    explanation: 'Simply seeing your spending in one place creates accountability that changes behaviour — no willpower required.',
                  },
                  {
                    text: 'You should only start budgeting when you have a full-time job.',
                    isTrue: false,
                    explanation: 'Student budgets are small but habits formed now last a lifetime — earlier is always better.',
                  },
                  {
                    text: 'Budgeting on an irregular income is possible by planning for your lowest expected month.',
                    isTrue: true,
                    explanation: 'Budget for the floor — any income above that becomes bonus savings.',
                  },
                  {
                    text: 'Most Singapore students actively track their monthly spending.',
                    isTrue: false,
                    explanation: 'Fewer than 20% track spending — despite 68% regularly exceeding their budget.',
                  },
                ],
              },
            ],
            flashcards: [
              { q: 'What is the core purpose of a budget?', a: 'To tell your money where to go before the month starts — not to track where it went after.' },
              { q: 'What percentage of Singapore students regularly exceed their monthly budget?', a: 'Around 68% — but fewer than 20% actively track their spending.' },
              { q: 'What is the biggest myth about budgeting?', a: 'That you need to earn enough to need one. Budgeting is most important when income is limited.' },
              { q: 'Name two common budget-busters for Singapore students.', a: 'Food delivery (GrabFood) and online shopping (Shopee/Lazada).' },
              { q: 'What is the difference between budgeting and tracking expenses?', a: 'Tracking is looking back at spending. Budgeting is planning forward — allocating money before you spend it.' },
            ],
          },

          // ── LESSON 2-2 ──────────────────────────────
          {
            id: '2-2',
            title: 'The 50/30/20 Rule',
            icon: '🥧',
            topic: 'The 50/30/20 budgeting framework applied to Singapore student life',
            duration: '6 min',
            xp: 60,
            sections: [
              { key: 'rule', heading: 'The 50/30/20 Framework' },
              { key: 'singapore', heading: 'Applying It in Singapore' },
              { key: 'adapt', heading: 'Adapting the Rule to Your Situation' },
            ],
            content: [
              {
                type: 'text',
                text: 'Most budgeting systems are complicated — dozens of categories, endless tracking, and easy to abandon. The 50/30/20 rule cuts through all of that with just three buckets: Needs, Wants, and Savings.',
              },
              {
                type: 'text',
                text: 'Tap a slice or card below to see exactly what goes into each bucket.',
              },
              {
                type: 'piechart',
                title: 'The 50/30/20 rule — your income split:',
                slices: [
                  {
                    label: 'Needs',
                    icon: '🏠',
                    percentage: 50,
                    color: '#4F46E5',
                    amount: '$750',
                    description: 'Rent, groceries, transport, phone bill, tuition fees. These are non-negotiable essentials — if this exceeds 50%, reduce Wants first.',
                  },
                  {
                    label: 'Wants',
                    icon: '🎉',
                    percentage: 30,
                    color: '#F59E0B',
                    amount: '$450',
                    description: 'Dining out, streaming, travel, hobbies, Shopee. Enjoyable but cuttable — this is the first bucket to reduce when money is tight.',
                  },
                  {
                    label: 'Savings',
                    icon: '💰',
                    percentage: 20,
                    color: '#059669',
                    amount: '$300',
                    description: 'Emergency fund, investments, loan repayments. Transfer this first on income day — never save "whatever is left over".',
                  },
                ],
                note: 'Amounts shown based on $1,500/month. Tap a slice or card to explore.',
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'On a $1,500/month student allowance: Needs = $750, Wants = $450, Savings = $300. That\'s $3,600 saved per year without a full-time job.',
              },
              {
                type: 'steps',
                title: 'How to apply 50/30/20 in Singapore:',
                steps: [
                  'Calculate your monthly after-tax income (allowance + part-time earnings)',
                  'Multiply by 0.5 — this is your Needs budget',
                  'Multiply by 0.3 — this is your Wants budget',
                  'Multiply by 0.2 — transfer this to savings on the day you receive income',
                  'Track spending in each category using Seedly or a spreadsheet',
                ],
              },
              {
                type: 'slider',
                icon: '🥧',
                title: '50/30/20 Calculator',
                description: 'Drag to your monthly income and see your three buckets update in real time.',
                min: 500,
                max: 5000,
                step: 100,
                initialValue: 1500,
                prefix: '$',
                calculateResult: (income) => [
                  { label: '🏠 Needs (50%)', value: `$${(income * 0.5).toLocaleString()}`, color: '#4F46E5' },
                  { label: '🎉 Wants (30%)', value: `$${(income * 0.3).toLocaleString()}`, color: '#F59E0B' },
                  { label: '💰 Savings (20%)', value: `$${(income * 0.2).toLocaleString()}`, color: '#059669' },
                ],
              },
              {
                type: 'bullets',
                title: 'Singapore-specific needs to account for:',
                items: [
                  '🚌 MRT/bus transport: $80–$150/month',
                  '🏠 Hall/HDB rent: $300–$900/month depending on campus',
                  '🍜 Hawker centre meals average $4–$6 (vs $12–$18 at restaurants)',
                  '📱 SIM-only mobile plans: $10–$25/month with Circles.Life or Giga',
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: If your rent is high (e.g. private housing), your Needs may exceed 50%. Adjust Wants to 20% and keep Savings at 20% minimum.',
              },
              {
                type: 'bot',
                label: '💬 What is the average student allowance in Singapore?',
                prompt: 'average monthly allowance stipend international student Singapore university 2024',
              },
            ],
            flashcards: [
              { q: 'What are the three buckets of the 50/30/20 rule?', a: '50% Needs (essentials), 30% Wants (lifestyle), 20% Savings/debt repayment.' },
              { q: 'On a $2,000/month income, how much goes to savings under 50/30/20?', a: '$400/month — transferred immediately when income arrives.' },
              { q: 'What counts as a "Need" vs a "Want" in Singapore?', a: 'Need: rent, MRT, groceries, tuition. Want: GrabFood delivery, Shopee, Netflix, dining out.' },
              { q: 'Why should you transfer savings first, before spending?', a: 'Waiting to "save what\'s left" means nothing is usually left — pay yourself first.' },
              { q: 'What should you do if rent takes up more than 50% of income?', a: 'Reduce Wants to 10–15% and keep Savings at 20% minimum. Needs can flex, savings shouldn\'t.' },
            ],
          },

          // ── LESSON 2-3 ──────────────────────────────
          {
            id: '2-3',
            title: 'Tracking Your Spending',
            icon: '🔍',
            topic: 'Expense tracking methods and tools for students in Singapore',
            duration: '5 min',
            xp: 60,
            sections: [
              { key: 'why', heading: 'Why Tracking Is Powerful' },
              { key: 'methods', heading: 'Three Ways to Track' },
              { key: 'tools', heading: 'Best Tools for Singapore Students' },
            ],
            content: [
              {
                type: 'text',
                text: 'You cannot manage what you don\'t measure. Expense tracking turns vague feelings about money into concrete data — and data is what drives change.',
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'Studies show that people who track their spending reduce discretionary expenses by an average of 15–20% in the first month — just from awareness alone.',
              },
              {
                type: 'text',
                text: 'There\'s no single best way to track spending — the best method is the one you\'ll actually stick to. See which of these scenarios matches your situation.',
              },
              {
                type: 'scenarios',
                title: 'Which tracking method fits you?',
                scenarios: [
                  {
                    icon: '📊',
                    situation: 'You want full control over your categories and love seeing custom breakdowns. You don\'t mind spending 10 minutes a week on it.',
                    options: [
                      {
                        text: 'Google Sheets spreadsheet — build your own system.',
                        biasLabel: 'Best fit ✓',
                        biasExplanation: 'Full customisation, free, and works offline. Best for detail-oriented people who want exactly the categories they need.',
                        isIdeal: true,
                      },
                      {
                        text: 'Cash envelope system — divide cash into labelled envelopes.',
                        biasLabel: 'Overkill for this need',
                        biasExplanation: 'Envelopes enforce hard limits but don\'t give you analytics or custom reports — and Singapore is largely cashless.',
                        isIdeal: false,
                      },
                      {
                        text: 'Just check your bank app at month-end.',
                        biasLabel: 'Too infrequent',
                        biasExplanation: 'Monthly reviews catch problems too late — you\'ve already overspent by the time you check.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '🏧',
                    situation: 'You keep overspending on food delivery and online shopping. You need something that physically stops you when the budget runs out.',
                    options: [
                      {
                        text: 'Cash envelope system — when the envelope is empty, stop spending.',
                        biasLabel: 'Best fit ✓',
                        biasExplanation: 'Physical cash creates a hard stop that digital payments can\'t replicate. The pain of handing over cash is real.',
                        isIdeal: true,
                      },
                      {
                        text: 'Seedly app — track digitally with bank integration.',
                        biasLabel: 'Good but softer limit',
                        biasExplanation: 'Seedly shows you when you\'ve overspent, but doesn\'t physically prevent it — requires more self-discipline.',
                        isIdeal: false,
                      },
                      {
                        text: 'Ignore it — I\'ll do better next month.',
                        biasLabel: 'Ostrich Effect',
                        biasExplanation: 'Avoidance reinforces the pattern. Without a system change, next month will look the same.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '📱',
                    situation: 'You want to start tracking but want something low-effort that works with your Singapore bank account automatically.',
                    options: [
                      {
                        text: 'Seedly — links to Singapore banks, auto-categorises transactions.',
                        biasLabel: 'Best fit ✓',
                        biasExplanation: 'Seedly integrates with DBS, OCBC, UOB and most local banks. Transactions are auto-pulled and categorised — minimal effort required.',
                        isIdeal: true,
                      },
                      {
                        text: 'Build a spreadsheet from scratch.',
                        biasLabel: 'Too much friction',
                        biasExplanation: 'A spreadsheet requires manual entry every time — easy to abandon after a few weeks if you want low effort.',
                        isIdeal: false,
                      },
                      {
                        text: 'DBS NAV Planner — already built into the DBS app.',
                        biasLabel: 'Also a good fit',
                        biasExplanation: 'If you bank with DBS, NAV Planner auto-categorises transactions with zero setup. Limited to DBS accounts only though.',
                        isIdeal: false,
                      },
                    ],
                  },
                ],
              },
              {
                type: 'text',
                text: 'Here are the four best expense tracking apps for students in Singapore — tap each one to see if it\'s right for you.',
              },
              {
                type: 'appcards',
                title: 'Best tracking apps for Singapore students:',
                apps: [
                  {
                    icon: '🇸🇬',
                    name: 'Seedly',
                    color: '#4F46E5',
                    tagline: 'Singapore\'s most popular personal finance app',
                    cost: 'Free',
                    rating: 4.5,
                    keyFeature: 'Links directly to Singapore banks (DBS, OCBC, UOB, Maybank) and auto-categorises every transaction. Includes a community Q&A for financial questions.',
                    bestFor: 'Students who want automatic tracking with zero manual entry and Singapore-specific bank support.',
                    singaporeTip: 'Seedly also has a "Financial Health Score" feature that benchmarks your spending against other Singapore users your age.',
                  },
                  {
                    icon: '📊',
                    name: 'Money Manager',
                    color: '#059669',
                    tagline: 'Simple, offline, no account needed',
                    cost: 'Free (one-time $4.99 for Pro)',
                    rating: 4.3,
                    keyFeature: 'Fully offline — no bank linking, no data sharing. Manual entry only, but extremely fast with a clean UI. Supports SGD natively.',
                    bestFor: 'Privacy-conscious students who prefer manual tracking and don\'t want to link bank accounts.',
                    singaporeTip: 'Works great alongside PayNow — manually log each transaction right after paying, before you forget.',
                  },
                  {
                    icon: '🏦',
                    name: 'DBS NAV Planner',
                    color: '#DC2626',
                    tagline: 'Built into your DBS app — zero setup',
                    cost: 'Free (DBS account required)',
                    rating: 4.1,
                    keyFeature: 'Automatically pulls and categorises all DBS/POSB transactions. Shows spending trends, savings goals, and a simple budget overview without leaving your banking app.',
                    bestFor: 'DBS or POSB account holders who want tracking with absolutely no extra apps or setup.',
                    singaporeTip: 'NAV Planner also shows your CPF balance and investment holdings alongside spending — useful for seeing your full financial picture.',
                  },
                  {
                    icon: '📈',
                    name: 'Syfe',
                    color: '#7C3AED',
                    tagline: 'Track spending and investments in one place',
                    cost: 'Free (investing features separate)',
                    rating: 4.2,
                    keyFeature: 'Tracks net worth, bank balances, and investment portfolio in a single dashboard. Less granular for day-to-day budgeting but excellent for the big picture.',
                    bestFor: 'Students who have started investing and want to see spending and net worth growth side by side.',
                    singaporeTip: 'Syfe integrates with Singpass MyInfo to pull financial data — setup takes under 2 minutes with your Singpass login.',
                  },
                ],
              },
              {
                type: 'text',
                text: 'Whichever app you choose, the habit that makes it work is a consistent weekly review. Here\'s the exact routine — takes 5 minutes.',
              },
              {
                type: 'steps',
                title: 'The 5-minute weekly review:',
                steps: [
                  'Every Sunday, open your tracking app or bank statement',
                  'Check actual vs planned spending in each 50/30/20 category',
                  'Identify the one category that went over budget',
                  'Decide one adjustment for the coming week',
                  'Repeat — takes 5 minutes and builds lasting financial awareness',
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: Enable transaction notifications on your banking app (DBS, OCBC, UOB). Each ping is a micro-reminder of your spending — far more effective than reviewing at month-end.',
              },
              {
                type: 'bot',
                label: '💬 Which budgeting app is most popular among Singapore students?',
                prompt: 'most popular budgeting expense tracking app Singapore students 2024',
              },
            ],
            flashcards: [
              { q: 'By how much do people typically reduce spending just by tracking?', a: '15–20% in the first month — awareness alone changes behaviour.' },
              { q: 'What is the best expense tracking app for Singapore students?', a: 'Seedly — it\'s Singapore-focused, links to local banks, and is free.' },
              { q: 'What is the 5-minute weekly financial review?', a: 'Check actual vs planned spending each Sunday, identify what went over, and plan one adjustment for the week ahead.' },
              { q: 'What bank feature helps Singapore students track spending passively?', a: 'Transaction notifications on DBS/OCBC/UOB apps — each ping creates micro-awareness of spending.' },
              { q: 'What is the difference between the cash envelope system and an app?', a: 'Envelopes use physical cash to enforce hard limits. Apps track digitally — better for Singapore\'s cashless society.' },
            ],
          },
        ],
      },

      // ─── CHAPTER 3: Saving & Emergency Funds ────────
      {
        id: 'chapter-3',
        title: 'Saving & Emergency Funds',
        icon: '🏦',
        description: 'Build the financial safety net that protects everything else',
        lessons: [

          // ── LESSON 3-1 ──────────────────────────────
          {
            id: '3-1',
            title: 'Why You Need an Emergency Fund',
            icon: '🛡️',
            topic: 'Emergency funds — purpose, size, and why they matter',
            duration: '5 min',
            xp: 70,
            sections: [
              { key: 'what', heading: 'What an Emergency Fund Is (and Isn\'t)' },
              { key: 'size', heading: 'How Much You Actually Need' },
              { key: 'without', heading: 'What Happens Without One' },
            ],
            content: [
              {
                type: 'text',
                text: 'An emergency fund is a dedicated pool of cash set aside for genuine financial emergencies — not planned expenses, not wants, and definitely not "opportunities". It is the foundation of every financial plan.',
              },
              {
                type: 'table',
                headers: ['✅ Real Emergency', '❌ Not an Emergency'],
                rows: [
                  ['Medical bill from an accident', 'Flight home for a holiday'],
                  ['Laptop breaks, needed for class', 'Laptop upgrade (old one works)'],
                  ['Job loss — covering rent gap', 'Sale on Shopee you "can\'t miss"'],
                  ['Family crisis requiring travel', 'Concert tickets'],
                ],
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'The standard recommendation is 3–6 months of essential expenses. For students in Singapore, that\'s roughly $3,000–$6,000 depending on your rent and lifestyle.',
              },
              {
                type: 'steps',
                title: 'Calculate your emergency fund target:',
                steps: [
                  'Add up your monthly essentials: rent + food + transport + phone',
                  'Multiply by 3 for a starter fund, 6 for a full fund',
                  'Example: $800 rent + $300 food + $120 transport + $20 phone = $1,240/month',
                  'Starter fund target: $1,240 × 3 = $3,720',
                  'Keep this in a separate savings account — not your daily account',
                ],
              },
              {
                type: 'slider',
                icon: '🛡️',
                title: 'Emergency Fund Calculator',
                description: 'Drag to your monthly essential expenses to calculate your fund targets.',
                min: 500,
                max: 4000,
                step: 50,
                initialValue: 1200,
                prefix: '$',
                calculateResult: (expenses) => [
                  { label: '🎯 Starter Fund (3 months)', value: `$${(expenses * 3).toLocaleString()}`, color: '#4F46E5' },
                  { label: '✅ Full Fund (6 months)', value: `$${(expenses * 6).toLocaleString()}`, color: '#059669' },
                  { label: '📅 At $200/month, starter fund in', value: `${Math.ceil((expenses * 3) / 200)} months`, color: '#F59E0B' },
                ],
              },
              {
                type: 'bullets',
                title: 'What happens without an emergency fund:',
                items: [
                  '💳 You go into credit card debt at 26.9% annual interest',
                  '🙏 You have to borrow from family or friends (stressful for relationships)',
                  '😰 Financial anxiety affects sleep quality and academic performance',
                  '📉 You sell investments at the wrong time to raise cash',
                  '🔄 You break a positive saving streak you worked hard to build',
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: Keep your emergency fund in a Singapore Savings Bond (SSB) or high-yield savings account — not a 0.05% standard savings account. You earn more while keeping it accessible.',
              },
              {
                type: 'bot',
                label: '💬 What is the current SSB interest rate?',
                prompt: 'Singapore Savings Bond SSB current interest rate 2024 2025',
              },
            ],
            flashcards: [
              { q: 'How many months of expenses should an emergency fund cover?', a: '3 months minimum (starter), 6 months for a full fund.' },
              { q: 'What is a real emergency vs a non-emergency?', a: 'Real: medical bill, job loss, broken essential item. Not real: sales, holidays, upgrades.' },
              { q: 'What happens if you have no emergency fund and face a crisis?', a: 'You go into high-interest credit card debt (26.9% p.a.) or borrow from family.' },
              { q: 'Where should you keep your emergency fund in Singapore?', a: 'In a high-yield savings account or SSB — accessible but separate from your daily spending account.' },
              { q: 'What is a starter emergency fund target for a Singapore student?', a: 'Around $3,000–$3,700 — 3 months of essential expenses (rent, food, transport, phone).' },
            ],
          },

          // ── LESSON 3-2 ──────────────────────────────
          {
            id: '3-2',
            title: 'How to Build Your Fund',
            icon: '🧱',
            topic: 'Strategies to build an emergency fund on a student budget',
            duration: '6 min',
            xp: 70,
            sections: [
              { key: 'start', heading: 'Starting From Zero' },
              { key: 'strategies', heading: 'Three Building Strategies' },
              { key: 'where', heading: 'Where to Keep It in Singapore' },
            ],
            content: [
              {
                type: 'text',
                text: 'Building an emergency fund on a student income feels daunting — but the goal is not to save $5,000 overnight. It\'s to make consistent, automatic, small deposits until the fund grows itself.',
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'Saving just $100/month for 30 months builds a $3,000 emergency fund. That\'s $25/week — roughly skipping 4 bubble teas per week.',
              },
              {
                type: 'text',
                text: 'Follow these five steps to get your emergency fund started from zero.',
              },
              {
                type: 'steps',
                title: 'Starting from zero — step by step:',
                steps: [
                  'Open a separate savings account (not your main account)',
                  'Set up an automatic transfer of $50–$100 on the day you receive income',
                  'Label the account "Emergency Fund — Do Not Touch"',
                  'Set a milestone: celebrate (cheaply) when you hit $500, $1,000, $3,000',
                  'Never spend it unless it\'s a genuine emergency',
                ],
              },
              {
                type: 'text',
                text: 'There are three proven strategies for building your fund — each suits a different situation. Tap each card to see how it works and who it\'s best for.',
              },
              {
                type: 'timeline',
                title: 'Three building strategies:',
                nodes: [
                  {
                    icon: '1',
                    label: 'Pay Yourself First',
                    sublabel: 'Most effective',
                    color: '#4F46E5',
                    examples: ['Salary day transfer', 'Auto-debit setup'],
                    details: [
                      'On income day, move your savings target immediately — before groceries, before GrabFood, before anything.',
                      'What\'s left after the transfer is yours to spend guilt-free. Works because it removes the decision entirely.',
                    ],
                    tip: 'Best for everyone — set up an automatic transfer so it happens without you thinking about it.',
                  },
                  {
                    icon: '2',
                    label: 'Round-Up Savings',
                    sublabel: 'No willpower needed',
                    color: '#0891B2',
                    examples: ['Kopi at $4.60 → $0.40 saved', 'App-based rounding'],
                    details: [
                      'Apps round up every purchase to the nearest dollar and move the difference to savings automatically.',
                      'Small amounts compound faster than you think — no fixed commitment required.',
                    ],
                    tip: 'Best for low or irregular income — the amounts are tiny but add up over months.',
                  },
                  {
                    icon: '3',
                    label: 'Windfall Saving',
                    sublabel: 'Accelerate your fund',
                    color: '#059669',
                    examples: ['Ang bao money', 'Bonuses', 'Tax refunds'],
                    details: [
                      'Save 100% of unexpected money before it gets absorbed into daily spending.',
                      'One ang bao season alone can add $200–$500 to your emergency fund.',
                    ],
                    tip: 'Best used alongside Strategy 1 — windfalls are one-off boosts, not a substitute for regular saving.',
                  },
                ],
              },
              {
                type: 'text',
                text: 'Test your understanding of the three strategies — swipe right for True, left for False.',
              },
              {
                type: 'tindertruefalse',
                title: 'Savings Strategy Check',
                instruction: 'Swipe right for True · Swipe left for False',
                statements: [
                  {
                    text: '"Pay yourself first" means saving whatever is left after spending.',
                    isTrue: false,
                    explanation: 'It\'s the opposite — transfer savings immediately when income arrives, before spending anything. Saving "what\'s left" rarely works.',
                  },
                  {
                    text: 'Round-up savings work best for people with irregular or low income.',
                    isTrue: true,
                    explanation: 'Small automatic round-ups accumulate without requiring a fixed monthly commitment — ideal when income varies.',
                  },
                  {
                    text: 'Ang bao money and bonuses should be spent as a reward — you earned it.',
                    isTrue: false,
                    explanation: 'Windfalls are one of the fastest ways to boost your emergency fund. Spending them first removes a key opportunity to accelerate savings.',
                  },
                  {
                    text: 'Having your emergency fund in a separate account makes it less likely you\'ll spend it.',
                    isTrue: true,
                    explanation: 'A psychological barrier — money visible in your daily account gets spent. Separation creates friction that protects the fund.',
                  },
                  {
                    text: 'Saving $100/month for 30 months builds a $3,000 emergency fund.',
                    isTrue: true,
                    explanation: 'Simple math — but the key insight is that $100/month is only $25/week, which is achievable even on a student budget.',
                  },
                ],
              },
              {
                type: 'text',
                text: 'Where you keep your emergency fund matters — the right account earns you interest while keeping the money accessible. Tap each option to find the best fit.',
              },
              {
                type: 'appcards',
                title: 'Best accounts for your emergency fund:',
                apps: [
                  {
                    icon: '🏦',
                    name: 'OCBC 360 Account',
                    color: '#DC2626',
                    tagline: 'Highest potential interest for working adults',
                    cost: 'Free to open',
                    rating: 4.5,
                    keyFeature: 'Up to 4.65% p.a. with salary credit, card spend, and insurance/investment bonuses. Interest is tiered — you earn more by doing more with OCBC.',
                    bestFor: 'Students who have started working and can credit salary into OCBC. Less suitable as a pure student account without salary credit.',
                    singaporeTip: 'As a student without salary credit, you\'ll earn the base rate (~0.05%). Open it now, but maximise interest once you start working.',
                  },
                  {
                    icon: '🏦',
                    name: 'UOB One Account',
                    color: '#0A84FF',
                    tagline: 'Great interest with consistent monthly spend',
                    cost: 'Free to open',
                    rating: 4.3,
                    keyFeature: 'Up to 4% p.a. with $500/month card spend and a GIRO debit. Simpler conditions than OCBC — spend $500/month and set up one GIRO.',
                    bestFor: 'Students who already spend $500+/month on their UOB card and have at least one GIRO debit set up.',
                    singaporeTip: 'Your MRT top-up or phone bill GIRO counts toward the bonus tier — easy to qualify if you use UOB as your main card.',
                  },
                  {
                    icon: '🏦',
                    name: 'DBS Multiplier',
                    color: '#FF3B30',
                    tagline: 'Bonus interest tied to your DBS ecosystem',
                    cost: 'Free to open',
                    rating: 4.1,
                    keyFeature: 'Up to 4.1% p.a. when you credit salary and transact across DBS categories (credit card, insurance, investments). Interest scales with how many categories you engage.',
                    bestFor: 'Students already using DBS as their main bank who want everything in one ecosystem.',
                    singaporeTip: 'DBS NAV Planner integrates directly with Multiplier — you can track both spending and savings interest in the same app.',
                  },
                  {
                    icon: '📜',
                    name: 'Singapore Savings Bond',
                    color: '#059669',
                    tagline: 'Government-backed, flexible, risk-free',
                    cost: 'Min. $500 to invest',
                    rating: 4.4,
                    keyFeature: 'Issued by the Singapore government — zero default risk. Step-up interest averaging ~3% p.a. over 10 years. Redeemable any month with no penalty.',
                    bestFor: 'Students with a lump sum ($500+) they won\'t need for at least 6–12 months. Not ideal for money you may need urgently.',
                    singaporeTip: 'Apply via DBS/OCBC/UOB internet banking or ATM using your CDP account. New tranches are issued monthly — check MAS website for current rates.',
                  },
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: As a student without a salary, you may not qualify for bonus interest tiers on OCBC/UOB. Use a standard savings account or SSB until you start working — even 3% beats 0.05%.',
              },
              {
                type: 'bot',
                label: '💬 Current OCBC 360 and UOB One interest rates',
                prompt: 'OCBC 360 UOB One DBS Multiplier current interest rates Singapore 2025',
              },
            ],
            flashcards: [
              { q: 'What is the "pay yourself first" strategy?', a: 'Transfer your savings immediately when income arrives — before spending on anything else.' },
              { q: 'How long does it take to save $3,000 at $100/month?', a: '30 months — or faster if you save windfalls like ang bao money or part-time bonuses.' },
              { q: 'Which Singapore bank accounts offer the highest savings interest rates?', a: 'OCBC 360, UOB One, and DBS Multiplier — all offer 3–4.65% p.a. with qualifying conditions.' },
              { q: 'Why should your emergency fund be in a separate account?', a: 'To create a psychological barrier — money you can see in your daily account gets spent.' },
              { q: 'What is a round-up savings strategy?', a: 'Apps automatically round up each purchase to the nearest dollar and save the difference — effortless micro-saving.' },
            ],
          },

          // ── LESSON 3-3 ──────────────────────────────
          {
            id: '3-3',
            title: 'Saving for Goals Beyond Emergencies',
            icon: '🌟',
            topic: 'Goal-based saving and short vs long-term saving strategies',
            duration: '5 min',
            xp: 70,
            sections: [
              { key: 'types', heading: 'Short vs Long-Term Savings' },
              { key: 'buckets', heading: 'The Multiple Savings Buckets Approach' },
              { key: 'tools', heading: 'Tools for Goal-Based Saving in Singapore' },
            ],
            content: [
              {
                type: 'text',
                text: 'Once your emergency fund is in place, the next step is saving intentionally for goals — whether that\'s a laptop in 3 months, a trip in 6 months, or a house in 10 years. Each goal deserves its own dedicated savings bucket.',
              },
              {
                type: 'text',
                text: 'The time horizon of your goal determines where you should keep the money. Tap each card to see the right account type for each horizon.',
              },
              {
                type: 'timeline',
                title: 'Time horizon → right account:',
                nodes: [
                  {
                    icon: '⚡',
                    label: 'Short-term',
                    sublabel: '< 1 year',
                    color: '#4F46E5',
                    accountType: 'High-yield savings',
                    examples: ['Laptop', 'Holiday', 'Semester fees'],
                    details: [
                      'Keep it accessible and risk-free — you need this money soon',
                      'High-yield savings accounts are ideal — OCBC 360, UOB One, DBS Multiplier',
                      'Never invest money you\'ll need within 12 months — markets can drop 20% overnight',
                    ],
                    tip: 'Saving $600 for a Japan trip in 8 months? OCBC 360 at ~4% p.a. — safe, accessible, and earning interest.',
                  },
                  {
                    icon: '📅',
                    label: 'Medium-term',
                    sublabel: '1–5 years',
                    color: '#F59E0B',
                    accountType: 'SSB or Fixed Deposit',
                    examples: ['Postgrad fees', 'Car', 'Wedding fund'],
                    details: [
                      'You can afford slightly less liquidity in exchange for better returns',
                      'Singapore Savings Bonds — government-backed, redeemable monthly, ~3% p.a.',
                      'Fixed deposits — lock in a rate for 6–24 months, typically 3–3.5% p.a.',
                    ],
                    tip: 'SSB gives you ~3% p.a. with full capital protection and monthly redemption if plans change.',
                  },
                  {
                    icon: '🌱',
                    label: 'Long-term',
                    sublabel: '5+ years',
                    color: '#059669',
                    accountType: 'Investments',
                    examples: ['House downpayment', 'Retirement', 'Financial freedom'],
                    details: [
                      'Long time horizons absorb market volatility — invest for significantly higher returns',
                      'STI ETF or global index funds (e.g. VWRA) for DIY investors',
                      'Robo-advisors (Syfe, StashAway) for hands-off investing with low minimums',
                      'Time in the market consistently beats timing the market',
                    ],
                    tip: '$100/month invested from age 22 at 7% p.a. grows to ~$240,000 by age 62. The same in savings: ~$55,000.',
                  },
                ],
              },
              
              {
                type: 'text',
                text: 'The most effective system is to give every savings goal its own named bucket. Tap each bucket below to see how it works and what to put in it.',
              },
              {
                type: 'buckets',
                title: 'The four savings buckets:',
                buckets: [
                  {
                    icon: '🛡️',
                    name: 'Emergency Fund',
                    color: '#DC2626',
                    subtitle: '3–6 months of expenses — always full, never touched',
                    fillPercent: 100,
                    details: [
                      'This is your financial safety net — fill it before all other buckets',
                      'Target: 3 months expenses minimum, 6 months ideal',
                      'Keep it in a high-yield savings account, not investments',
                      'Only use it for genuine emergencies: job loss, medical, urgent repairs',
                    ],
                    tip: 'Once full, redirect the monthly contribution to Bucket 2 or 3.',
                  },
                  {
                    icon: '🎯',
                    name: 'Goal Fund',
                    color: '#4F46E5',
                    subtitle: 'Named after your specific goal — e.g. "Japan 2025"',
                    fillPercent: 75,
                    details: [
                      'One account per goal — name it after the goal so it feels real',
                      'Calculate: total needed ÷ months remaining = monthly save target',
                      'OCBC Savings Pockets or separate sub-accounts work perfectly',
                      'Short-term goals: savings account. Medium-term: SSB or fixed deposit',
                    ],
                    tip: 'Naming an account after a goal increases the likelihood of reaching it by 31% — behavioural economics research.',
                  },
                  {
                    icon: '📈',
                    name: 'Investment Fund',
                    color: '#059669',
                    subtitle: 'Long-term wealth building — 5+ year horizon',
                    fillPercent: 50,
                    details: [
                      'Only money you won\'t need for 5+ years should be invested',
                      'Start with a robo-advisor (Syfe, StashAway) — low minimums, auto-diversified',
                      'STI ETF or global index funds for DIY investors',
                      'Time in the market beats timing the market — start small, start now',
                    ],
                    tip: 'Even $50/month invested from age 22 grows to ~$150,000 by retirement at 7% p.a.',
                  },
                  {
                    icon: '🎉',
                    name: 'Fun Fund',
                    color: '#F59E0B',
                    subtitle: 'Guilt-free spending money — optional but powerful',
                    fillPercent: 25,
                    details: [
                      'A dedicated fun budget removes guilt from spending on enjoyment',
                      'When it\'s empty, you stop — no guilt, no overspending',
                      'Typically 10–15% of your Wants budget set aside monthly',
                      'Use it for: concerts, spontaneous trips, treats, gifts',
                    ],
                    tip: 'Having a Fun Fund paradoxically reduces impulsive overspending — you spend less when you know there\'s a designated amount.',
                  },
                ],
              },
              {
                type: 'text',
                text: 'Setting up a goal-based account in Singapore takes less than 5 minutes. Here\'s exactly how.',
              },
              {
                type: 'steps',
                title: 'Setting up a goal-based savings account:',
                steps: [
                  'Open a sub-account or separate account (most Singapore banks allow this free)',
                  'Name it after your goal — "Japan 2025" or "MacBook Fund"',
                  'Calculate how much you need and by when',
                  'Divide the total by the number of months — that is your monthly save target',
                  'Set up an automatic transfer for that amount on income day',
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Singapore Tip: OCBC allows you to create multiple savings "pockets" within one account — each named separately. It\'s free, instant, and perfect for the buckets approach.',
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'Naming a savings account after a goal increases the likelihood of reaching it by 31% — according to behavioural economics research.',
              },
              {
                type: 'mcq',
                icon: '🌟',
                title: 'Goal Horizon Quiz',
                question: 'You want to save for a Japan trip happening in 8 months. Which account type is BEST?',
                options: [
                  'Invest it in STI ETF for higher returns',
                  'High-yield savings account (OCBC 360)',
                  'CPF Special Account top-up',
                  'Keep it in your daily spending account',
                ],
                correctIndex: 1,
                explanation: 'Short-term goals (< 1 year) need accessible, low-risk accounts. STI ETF is too volatile for 8 months. CPF locks money in. Daily accounts earn near zero interest.',
              },
              {
                type: 'bot',
                label: '💬 How do I set up savings pockets in OCBC Singapore?',
                prompt: 'OCBC savings pockets how to set up sub accounts Singapore 2024 2025',
              },
            ],
            flashcards: [
              { q: 'What is the multiple savings buckets approach?', a: 'Separate savings pots for different goals: Emergency Fund, Specific Goals, Investments, and Fun Money.' },
              { q: 'What account type is best for a short-term goal (< 1 year)?', a: 'A high-yield savings account — accessible, earns decent interest, no lock-in period.' },
              { q: 'What account type is best for a 3-year savings goal?', a: 'Fixed deposit or Singapore Savings Bond — slightly higher rates, some lock-in acceptable.' },
              { q: 'How does naming a savings account affect your saving behaviour?', a: 'It increases goal achievement by 31% — naming creates a psychological commitment.' },
              { q: 'How do you calculate a monthly savings target for a goal?', a: 'Total amount needed ÷ number of months remaining = monthly transfer amount.' },
            ],
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  // MODULE 2 — Banking & Cash Management
  // ═══════════════════════════════════════════════════
  {
      id: 'module-2',
      title: 'Banking & Cash Management',
      description: 'Master Singapore\'s banking system and make your money work harder',
      icon: '🏦',
      color: '#0891B2',
      colorLight: '#ECFEFF',
      chapters: [
        {
          id: 'chapter-4',
          title: 'Singapore Banking Landscape',
          icon: '🗺️',
          description: 'Navigate Singapore\'s local and digital banking options',
          lessons: [
            {
              id: '4-1', title: 'The Big Three Local Banks', icon: '🏛️',
              topic: 'DBS OCBC UOB Singapore banking overview',
              duration: '6 min', xp: 70,
              sections: [{ key: 'overview', heading: 'DBS, OCBC & UOB Overview' }, { key: 'accounts', heading: 'Account Types' }, { key: 'choose', heading: 'Which Bank Should You Choose?' }],
              content: [
                {
                  type: 'text',
                  text: 'Singapore has three local banks that dominate its financial system — DBS, OCBC, and UOB. All three are SGX-listed, regulated by the Monetary Authority of Singapore (MAS), and your deposits are protected up to $75,000 per bank by the Singapore Deposit Insurance Corporation (SDIC).',
                },
                {
                  type: 'callout',
                  variant: 'fact',
                  text: 'Singapore\'s Big Three are consistently ranked among the safest banks in Asia and the world — DBS has been named World\'s Best Bank multiple times by Global Finance magazine.',
                },
                {
                  type: 'text',
                  text: 'Each bank has its own personality, strengths, and product ecosystem. As an international student, your first decision is simply: which one do I open my main account with?',
                },
                {
                  type: 'timeline',
                  title: 'Meet the Big Three:',
                  nodes: [
                    {
                      icon: '🔴',
                      label: 'DBS',
                      sublabel: 'Largest in SEA',
                      color: '#DC2626',
                      examples: ['digibank app', 'PayLah!', 'DBS Multiplier'],
                      details: [
                        'Largest bank in Southeast Asia by assets.',
                        'Best-in-class digital banking app (digibank) and most ATMs in Singapore.',
                        'Home of the DBS Multiplier high-yield account and strong PayLah! integration.',
                      ],
                      tip: 'Best for: students who want the widest ATM network and the most polished app experience.',
                    },
                    {
                      icon: '🟠',
                      label: 'OCBC',
                      sublabel: 'Student-friendly',
                      color: '#EA580C',
                      examples: ['OCBC 360', 'Savings Pockets', 'OCBC Digital'],
                      details: [
                        'Second largest local bank — popular with students for its low barrier to entry.',
                        'Home of the OCBC 360 high-yield account with Savings Pockets for goal-based saving.',
                        'OCBC Digital app rated highly for UX and ease of use.',
                      ],
                      tip: 'Best for: students who want to separate money into named savings goals without opening multiple accounts.',
                    },
                    {
                      icon: '🔵',
                      label: 'UOB',
                      sublabel: 'Regional reach',
                      color: '#1D4ED8',
                      examples: ['UOB One', 'UOB TMRW', 'Credit rewards'],
                      details: [
                        'Third largest local bank with wide regional presence across Southeast Asia.',
                        'Home of the UOB One high-yield account — simple conditions, strong interest.',
                        'UOB TMRW app aimed at younger users with strong credit card rewards ecosystem.',
                      ],
                      tip: 'Best for: students who already spend consistently each month and want to earn interest on that spending.',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Every bank offers a similar set of core account types. Understanding the differences helps you avoid fees and maximise what your money earns.',
                },
                {
                  type: 'table',
                  headers: ['Account Type', 'Purpose', 'Interest Rate', 'Best For'],
                  rows: [
                    ['Savings Account', 'Everyday banking & saving', '0.05% – 7.65% p.a.', 'Primary account'],
                    ['Current Account', 'High-volume transactions, cheques', '0% (no interest)', 'Business / freelancers'],
                    ['Fixed Deposit', 'Lock away funds for higher return', '2.5% – 3.5% p.a.', 'Lump sums you won\'t need'],
                    ['Multi-Currency Account', 'Hold & transact in foreign currencies', 'Varies by currency', 'International students / remittances'],
                  ],
                },
                {
                  type: 'callout',
                  variant: 'tip',
                  text: 'As an international student, a Savings Account is your starting point. If you regularly send money home or receive funds from overseas, ask about a Multi-Currency Account — it can save you a lot on FX conversion fees.',
                },
                {
                  type: 'text',
                  text: 'There is no single "best" bank — the right choice depends on how you use your account. Here are some common student scenarios:',
                },
                {
                  type: 'scenarios',
                  title: 'Which Bank Fits You?',
                  scenarios: [
                    {
                      icon: '📱',
                      situation: 'You want the best mobile app experience and the most ATMs on campus.',
                      options: [
                        {
                          text: 'DBS digibank',
                          biasLabel: 'Best choice ✓',
                          biasExplanation: 'DBS digibank is consistently rated the best digital banking app in Singapore, and DBS has the widest ATM network — including on most university campuses.',
                          isIdeal: true,
                        },
                        {
                          text: 'UOB TMRW',
                          biasLabel: 'Good but limited ATMs',
                          biasExplanation: 'UOB TMRW is a solid app for younger users but UOB has fewer ATMs than DBS island-wide.',
                          isIdeal: false,
                        },
                        {
                          text: 'OCBC Digital',
                          biasLabel: 'Great UX, fewer ATMs',
                          biasExplanation: 'OCBC Digital is highly rated but OCBC\'s ATM footprint is smaller than DBS.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '🎯',
                      situation: 'You want to set up multiple savings goals (holiday fund, laptop fund, emergency fund) in separate pockets.',
                      options: [
                        {
                          text: 'UOB One',
                          biasLabel: 'No pockets feature',
                          biasExplanation: 'UOB One is great for interest but doesn\'t offer goal-based savings pockets.',
                          isIdeal: false,
                        },
                        {
                          text: 'OCBC 360 with Savings Pockets',
                          biasLabel: 'Best choice ✓',
                          biasExplanation: 'OCBC\'s Savings Pockets feature lets you create named sub-accounts within your 360 account — perfect for goal-based saving without opening multiple accounts.',
                          isIdeal: true,
                        },
                        {
                          text: 'DBS Multiplier',
                          biasLabel: 'No pockets feature',
                          biasExplanation: 'DBS Multiplier is excellent for interest but lacks a built-in savings pockets feature.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '✈️',
                      situation: 'You send money home to family every month and want to minimise fees.',
                      options: [
                        {
                          text: 'DBS Remit',
                          biasLabel: 'Best bank option ✓',
                          biasExplanation: 'DBS Remit offers zero-fee transfers to many countries with competitive exchange rates — the best option among the three local banks.',
                          isIdeal: true,
                        },
                        {
                          text: 'Standard OCBC/UOB transfer',
                          biasLabel: 'Higher fees',
                          biasExplanation: 'Standard international transfers through OCBC or UOB typically incur higher fees and less competitive FX rates.',
                          isIdeal: false,
                        },
                        {
                          text: 'ATM cash withdrawal + overseas transfer',
                          biasLabel: 'Most expensive option',
                          biasExplanation: 'Withdrawing cash and transferring manually incurs the highest fees and worst exchange rates.',
                          isIdeal: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'tindertruefalse',
                  title: 'Bank Knowledge Check',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    { text: 'All three local banks are regulated by MAS.', isTrue: true, explanation: 'DBS, OCBC, and UOB are all licensed and regulated by MAS — Singapore\'s central bank and financial regulator.' },
                    { text: 'A current account earns higher interest than a savings account.', isTrue: false, explanation: 'Current accounts typically earn 0% interest — they\'re designed for frequent transactions, not saving.' },
                    { text: 'SDIC protects your deposits up to $75,000 per bank.', isTrue: true, explanation: 'The Singapore Deposit Insurance Corporation insures up to $75,000 per depositor per bank — so your money is safe even if a bank fails.' },
                    { text: 'You need SingPass to open a bank account as an international student.', isTrue: false, explanation: 'As an international student, you can open an account with your passport and student pass — SingPass is helpful but not always required.' },
                    { text: 'DBS has the largest ATM network in Singapore.', isTrue: true, explanation: 'DBS/POSB has the most extensive ATM and branch network in Singapore, including on most university campuses.' },
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Current student account opening requirements for DBS, OCBC and UOB',
                  prompt: 'What are the current student account opening requirements and any welcome offers for DBS, OCBC, and UOB in Singapore?',
                },
              ],
              flashcards: [
                { q: 'What are Singapore\'s three local banks?', a: 'DBS, OCBC, and UOB — all SGX-listed and regulated by MAS.' },
                { q: 'How much do the SDIC protect per depositor per bank?', a: 'Up to $75,000 — so your savings are safe even if a bank fails.' },
                { q: 'What is the difference between a savings account and a current account?', a: 'Savings accounts earn interest (0.05%–7.65%); current accounts earn 0% but support high-volume transactions and cheques.' },
                { q: 'Which local bank has the best digital app and widest ATM network?', a: 'DBS — its digibank app is consistently rated top in Singapore, and it has the most ATMs island-wide.' },
                { q: 'What account type is best for international students sending money home?', a: 'A Multi-Currency Account or using DBS Remit — both reduce FX conversion fees on overseas transfers.' },
              ],
            },
            {
              id: '4-2',
              title: 'Digital Banks & Fintech',
              icon: '📱',
              topic: 'Singapore digital banks GXS Trust MariBank',
              duration: '5 min',
              xp: 70,
              sections: [
                { key: 'digital', heading: 'Digital Banks in Singapore' },
                { key: 'compare', heading: 'Digital vs Traditional' },
                { key: 'pick', heading: 'When to Use Each' },
              ],
              content: [
                {
                  type: 'text',
                  text: 'Singapore\'s banking landscape changed in 2022 when the Monetary Authority of Singapore (MAS) granted digital full bank licences to a new wave of challengers. These digital banks have no physical branches — everything happens on your phone.',
                },
                {
                  type: 'callout',
                  variant: 'fact',
                  text: 'MAS granted 4 digital bank licences in 2020 — the first new bank licences in Singapore in over 20 years. GXS, Trust, and MariBank all launched between 2022 and 2023.',
                },
                {
                  type: 'text',
                  text: 'Three digital banks are now live in Singapore. Each is backed by a major tech or retail ecosystem — which shapes who they\'re best for.',
                },
                {
                  type: 'timeline',
                  title: 'Singapore\'s three digital banks:',
                  nodes: [
                    {
                      icon: '🟢',
                      label: 'GXS Bank',
                      sublabel: 'Grab + Singtel',
                      color: '#059669',
                      examples: ['GXS FlexiLoan', 'Up to 3.48% p.a.', 'Grab ecosystem'],
                      details: [
                        'Backed by Grab and Singtel — targets gig workers and underserved earners.',
                        'Offers a high-yield savings account with tiered interest up to 3.48% p.a.',
                        'GXS FlexiLoan provides small personal loans without requiring a formal credit history — useful for students.',
                      ],
                      tip: 'Best for: Grab users and gig economy workers who want flexible credit and competitive savings rates.',
                    },
                    {
                      icon: '🔵',
                      label: 'Trust Bank',
                      sublabel: 'Standard Chartered + FairPrice',
                      color: '#1D4ED8',
                      examples: ['No minimum balance', 'FairPrice linkup', 'Up to 2.5% p.a.'],
                      details: [
                        'Backed by Standard Chartered and NTUC FairPrice — deeply integrated with Singapore\'s largest supermarket chain.',
                        'No minimum balance, no fall-below fees, and no foreign transaction fees.',
                        'Earns LinkPoints at FairPrice and Kopitiam — useful for everyday student spending.',
                      ],
                      tip: 'Best for: students who shop at FairPrice regularly and want a zero-fee account with grocery rewards.',
                    },
                    {
                      icon: '🟡',
                      label: 'MariBank',
                      sublabel: 'Sea Limited (Shopee)',
                      color: '#D97706',
                      examples: ['Up to 3.19% p.a.', 'Shopee ecosystem', 'Sea Money'],
                      details: [
                        'Backed by Sea Limited — the parent company of Shopee, Garena, and SeaMoney.',
                        'Currently invite-only via the Shopee app, targeting Shopee\'s existing user base.',
                        'Offers competitive savings rates with a simple, no-frills interface.',
                      ],
                      tip: 'Best for: frequent Shopee users already in the Sea ecosystem looking for a simple high-yield savings option.',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Digital banks and traditional banks serve different purposes. Neither is strictly better — knowing when to use each is the key.',
                },
                {
                  type: 'table',
                  headers: ['Feature', 'Digital Banks', 'Traditional Banks (DBS/OCBC/UOB)'],
                  rows: [
                    ['Branches & ATMs', 'None — fully app-based', 'Island-wide network'],
                    ['Minimum balance', 'Usually $0', '$0–$3,000 depending on account'],
                    ['Fall-below fees', 'None', 'Up to $5/month if below minimum'],
                    ['Interest rates', 'Competitive base rates', 'Higher with salary credit/spend bonuses'],
                    ['Overseas transfers', 'Limited or via partners', 'DBS Remit, OCBC, UOB overseas transfer'],
                    ['Student loans / credit', 'GXS FlexiLoan available', 'Requires formal credit history'],
                    ['SDIC protected', 'Yes — up to $75,000', 'Yes — up to $75,000'],
                  ],
                },
                {
                  type: 'callout',
                  variant: 'tip',
                  text: 'Singapore Tip: Digital banks are SDIC-insured just like traditional banks — your deposits up to $75,000 are equally protected. The difference is convenience and fee structure, not safety.',
                },
                {
                  type: 'text',
                  text: 'The smartest strategy isn\'t choosing one over the other — it\'s using both. Here\'s how to think about it.',
                },
                {
                  type: 'flipcards',
                  title: 'How to use both types together:',
                  cards: [
                    {
                      frontLabel: '❌ Common mistake',
                      backLabel: '✅ Smarter approach',
                      front: 'Putting all your money in one bank and hoping for the best interest rate.',
                      back: 'Use a traditional bank for your primary account (salary, bills, ATM access) and a digital bank for a high-yield savings pot.',
                      tag: 'Split your money strategically',
                    },
                    {
                      frontLabel: '❌ Common mistake',
                      backLabel: '✅ Smarter approach',
                      front: 'Ignoring digital banks because they\'re "new" and seem risky.',
                      back: 'All MAS-licensed digital banks are SDIC-insured. GXS and Trust have been operating since 2022 without issues.',
                      tag: 'Licensed = protected',
                    },
                    {
                      frontLabel: '❌ Common mistake',
                      backLabel: '✅ Smarter approach',
                      front: 'Using a traditional savings account earning 0.05% for your emergency fund.',
                      back: 'Park your emergency fund in a digital bank or high-yield account earning 2–3%+ while keeping it accessible.',
                      tag: 'Make idle money work',
                    },
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Current interest rates for GXS, Trust, and MariBank savings accounts',
                  prompt: 'Current savings account interest rates GXS Bank Trust Bank MariBank Singapore 2025',
                },
                {
                  type: 'text',
                  text: 'Test your understanding — swipe right for True, left for False.',
                },
                {
                  type: 'tindertruefalse',
                  title: 'Digital Bank Facts',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    {
                      text: 'Digital banks in Singapore are not protected by SDIC.',
                      isTrue: false,
                      explanation: 'All MAS-licensed digital banks — including GXS, Trust, and MariBank — are SDIC-insured up to $75,000, just like traditional banks.',
                    },
                    {
                      text: 'GXS Bank is backed by Grab and Singtel.',
                      isTrue: true,
                      explanation: 'GXS Bank is a joint venture between Grab and Singtel — targeting gig workers, frequent Grab users, and those without formal credit histories.',
                    },
                    {
                      text: 'Trust Bank charges a fall-below fee if your balance drops below $1,000.',
                      isTrue: false,
                      explanation: 'Trust Bank has no minimum balance requirement and no fall-below fees — one of its key advantages over traditional banks.',
                    },
                    {
                      text: 'Digital banks typically offer higher base interest rates than traditional savings accounts.',
                      isTrue: true,
                      explanation: 'Digital banks generally offer more competitive base rates (2–3%+) compared to traditional banks\' base rates (~0.05%), though traditional banks can offer higher rates with salary credit bonuses.',
                    },
                    {
                      text: 'MariBank is backed by Sea Limited, the parent company of Shopee.',
                      isTrue: true,
                      explanation: 'MariBank is Sea Limited\'s digital banking arm — leveraging the Shopee and SeaMoney ecosystem to reach its existing user base.',
                    },
                  ],
                },
              ],
              flashcards: [
                { q: 'Name Singapore\'s three licensed digital banks.', a: 'GXS Bank (Grab + Singtel), Trust Bank (Standard Chartered + FairPrice), and MariBank (Sea Limited / Shopee).' },
                { q: 'Are digital bank deposits in Singapore protected by SDIC?', a: 'Yes — all MAS-licensed digital banks are SDIC-insured up to $75,000, the same as traditional banks.' },
                { q: 'What is GXS FlexiLoan?', a: 'A small personal loan product from GXS Bank that doesn\'t require a formal credit history — useful for students and gig workers.' },
                { q: 'What is the smart two-bank strategy for students?', a: 'Use a traditional bank for your primary account (salary, ATM, bills) and a digital bank for a high-yield savings pot earning 2–3%+.' },
                { q: 'Which digital bank is linked to FairPrice and earns grocery rewards?', a: 'Trust Bank — backed by Standard Chartered and NTUC FairPrice, it earns LinkPoints on everyday spending.' },
              ],
            },
            {
              id: '4-3',
              title: 'PayNow & Mobile Payments',
              icon: '💳',
              topic: 'PayNow SGQR Singapore cashless payments',
              duration: '4 min',
              xp: 60,
              sections: [
                { key: 'paynow', heading: 'How PayNow Works' },
                { key: 'safety', heading: 'Staying Safe' },
                { key: 'tips', heading: 'Smart Usage Tips' },
              ],
              content: [
                {
                  type: 'text',
                  text: 'Singapore is one of the most cashless societies in the world. PayNow, SGQR, and e-wallets have replaced cash for most daily transactions — from hawker centres to university canteens. As an international student, understanding these systems is essential from day one.',
                },
                {
                  type: 'callout',
                  variant: 'fact',
                  text: 'In 2023, PayNow processed over 270 million transactions worth more than $170 billion — an average of over 700,000 transfers every single day.',
                },
                {
                  type: 'keyterm',
                  term: 'PayNow',
                  definition: 'Singapore\'s instant, free bank-to-bank transfer system. Link your mobile number or NRIC to your bank account and send or receive money in seconds — no account numbers needed.',
                },
                {
                  type: 'text',
                  text: 'Singapore\'s cashless ecosystem has three main layers. Understanding each one helps you use the right tool in the right situation.',
                },
                {
                  type: 'timeline',
                  title: 'Singapore\'s three cashless layers:',
                  nodes: [
                    {
                      icon: '⚡',
                      label: 'PayNow',
                      sublabel: 'Instant bank transfer',
                      color: '#4F46E5',
                      examples: ['Split bills', 'Pay friends', 'Receive allowance'],
                      details: [
                        'Links your mobile number or NRIC to your bank account — no account number needed.',
                        'Transfers are instant, free, and available 24/7 across all major Singapore banks.',
                        'Supported by DBS, OCBC, UOB, GXS, Trust, and more.',
                      ],
                      tip: 'Register your PayNow via your bank\'s app in under 2 minutes — you\'ll use it every day.',
                    },
                    {
                      icon: '📱',
                      label: 'SGQR',
                      sublabel: 'Scan to pay anywhere',
                      color: '#0891B2',
                      examples: ['Hawker centres', 'Retail shops', 'Campus canteens'],
                      details: [
                        'SGQR is Singapore\'s unified QR code standard — one QR code accepts payments from any app.',
                        'Scan with your bank app, GrabPay, FavePay, or any supported e-wallet.',
                        'Widely accepted at hawker centres, coffee shops, and retail outlets island-wide.',
                      ],
                      tip: 'Most hawker stalls now display an SGQR code — scan with DBS PayLah!, OCBC, or UOB TMRW and pay instantly.',
                    },
                    {
                      icon: '👛',
                      label: 'E-Wallets',
                      sublabel: 'App-based spending',
                      color: '#059669',
                      examples: ['GrabPay', 'FavePay', 'Shopee Pay'],
                      details: [
                        'E-wallets like GrabPay, FavePay, and Shopee Pay store a balance you top up from your bank.',
                        'Often offer cashback and rewards that your bank account doesn\'t — useful for everyday spending.',
                        'Not the same as PayNow — e-wallet balances are not SDIC insured, so don\'t store large amounts.',
                      ],
                      tip: 'Use e-wallets for small daily spending to earn rewards, but keep your main savings in your bank account.',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Different situations call for different payment tools. Swipe through to see the smartest approach for each common student scenario.',
                },
                {
                  type: 'flipcards',
                  title: 'What\'s the smartest way to pay?',
                  cards: [
                    {
                      frontLabel: '📍 Situation',
                      backLabel: '✅ Smartest approach',
                      front: 'Splitting an $80 group dinner with 4 friends.',
                      back: 'Collect via PayNow to your mobile number — instant, free, and works across all banks. No need for cash or a third-party app.',
                      tag: 'PayNow is always free',
                    },
                    {
                      frontLabel: '📍 Situation',
                      backLabel: '✅ Smartest approach',
                      front: 'Paying $4.50 for chicken rice at a hawker centre.',
                      back: 'Scan the SGQR code with your bank app — faster than cash, no change needed, and some banks offer cashback on QR payments.',
                      tag: 'SGQR works everywhere',
                    },
                    {
                      frontLabel: '📍 Situation',
                      backLabel: '✅ Smartest approach',
                      front: 'Receiving your monthly allowance from your parents overseas.',
                      back: 'Ask them to use Wise or your bank\'s international transfer link — and register PayNow so local transfers land instantly once the money arrives in Singapore.',
                      tag: 'PayNow for local, Wise for overseas',
                    },
                    {
                      frontLabel: '📍 Situation',
                      backLabel: '✅ Smartest approach',
                      front: 'Ordering Grab Food and paying for your Grab rides daily.',
                      back: 'Top up GrabPay wallet with a set weekly budget — you earn GrabRewards points and it naturally limits your Grab spending.',
                      tag: 'E-wallet as a spending cap',
                    },
                  ],
                },
                {
                  type: 'callout',
                  variant: 'warning',
                  text: 'Scam alert: In 2023, PayNow-related scams cost Singaporeans over $13 million. The most common tactic is a fake "PayNow confirmation" screenshot — always verify transfers in your bank app, never via a screenshot.',
                },
                {
                  type: 'text',
                  text: 'PayNow is safe — but only if you use it correctly. Test your knowledge on safe payment behaviour.',
                },
                {
                  type: 'tindertruefalse',
                  title: 'Safe Payment Habits',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    {
                      text: 'A PayNow transfer confirmation screenshot is proof that you have received money.',
                      isTrue: false,
                      explanation: 'Screenshots can be faked. Always verify incoming transfers directly in your bank app — never release goods or services based on a screenshot alone.',
                    },
                    {
                      text: 'You should register PayNow with your mobile number so people can pay you without knowing your bank account number.',
                      isTrue: true,
                      explanation: 'That\'s exactly what PayNow is for — your mobile number acts as a proxy, so you never need to share sensitive account details.',
                    },
                    {
                      text: 'E-wallet balances (GrabPay, Shopee Pay) are protected by SDIC up to $75,000.',
                      isTrue: false,
                      explanation: 'E-wallet balances are NOT SDIC insured — only licensed bank deposits are. Keep large sums in your bank account, not your e-wallet.',
                    },
                    {
                      text: 'Setting a daily PayNow transaction limit in your bank app reduces your risk if your phone is stolen.',
                      isTrue: true,
                      explanation: 'Most banks let you set a daily transfer limit. Lowering it means a thief can only move a small amount even if they access your app.',
                    },
                    {
                      text: 'PayNow transfers between Singapore banks are free and instant at all hours.',
                      isTrue: true,
                      explanation: 'PayNow is free, instant, and available 24/7 — there are no transfer fees between participating banks regardless of the time or day.',
                    },
                  ],
                },
                {
                  type: 'checklist',
                  title: '✅ Your PayNow setup checklist:',
                  items: [
                    'Register PayNow with your mobile number via your bank app — takes under 2 minutes.',
                    'Set a daily transaction limit of $200–$500 for safety while studying.',
                    'Enable push notifications for every transfer so you spot unauthorised transactions immediately.',
                    'Never confirm a payment based on a screenshot — always check your bank app directly.',
                    'Keep your e-wallet balance small — top up weekly and treat it like a physical wallet.',
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Current PayNow daily transaction limits and recent scam statistics',
                  prompt: 'PayNow daily transaction limit Singapore banks 2025 scam statistics',
                },
              ],
              flashcards: [
                { q: 'What is PayNow?', a: 'Singapore\'s instant, free bank transfer system — link your mobile number or NRIC to your bank account and send money in seconds.' },
                { q: 'What is SGQR?', a: 'Singapore\'s unified QR code standard — one QR code accepts payments from any bank app or e-wallet.' },
                { q: 'Are e-wallet balances (GrabPay, Shopee Pay) SDIC insured?', a: 'No — only licensed bank deposits are SDIC insured. Keep large sums in your bank account, not an e-wallet.' },
                { q: 'How do you verify a PayNow transfer safely?', a: 'Always check your bank app directly — never accept a screenshot as proof of payment.' },
                { q: 'What is one smart way to limit Grab overspending?', a: 'Top up your GrabPay wallet with a fixed weekly budget — it naturally caps your spending and earns rewards.' },
              ],
            },
          ],
        },
        {
          id: 'chapter-5',
          title: 'High Yield Savings Accounts',
          icon: '📈',
          description: 'Earn more interest on money you\'re already saving',
          lessons: [
            {
              id: '5-1', title: 'How HYSA Interest Works', icon: '🧮',
              topic: 'High yield savings account interest rates Singapore',
              duration: '6 min', xp: 80,
              sections: [{ key: 'how', heading: 'How Bonus Interest Works' }, { key: 'qualify', heading: 'Qualifying Conditions' }, { key: 'calc', heading: 'Calculating Your Earnings' }],
              content: [
                {
                  type: 'text',
                  text: 'Most students park their money in a basic savings account earning 0.05% interest per year. High-Yield Savings Accounts (HYSAs) can earn 10 to 100 times more — but only if you understand how the bonus interest system works.',
                },
                {
                  type: 'callout',
                  variant: 'fact',
                  text: '$1,000 in a basic savings account at 0.05% earns $0.50 a year. The same $1,000 in an HYSA at 4% earns $40 — 80 times more, just by choosing the right account and meeting its conditions.',
                },
                {
                  type: 'keyterm',
                  term: 'High-Yield Savings Account (HYSA)',
                  definition: 'A savings account that offers significantly higher interest than a standard account — but only when you meet specific conditions like crediting your salary, spending on a linked card, or setting up GIRO payments.',
                },
                {
                  type: 'text',
                  text: 'HYSA interest is not automatic. It is built in layers — a small base rate that everyone earns, plus bonus tiers you unlock by taking specific actions. The more conditions you meet, the higher your effective rate.',
                },
                {
                  type: 'timeline',
                  title: 'How HYSA interest is structured:',
                  nodes: [
                    {
                      icon: '🏦',
                      label: 'Base Interest',
                      sublabel: 'Everyone gets this',
                      color: '#6B7280',
                      examples: ['~0.05% p.a.', 'No conditions needed', 'Applies to all balances'],
                      details: [
                        'The base rate is what your money earns by default — no actions required.',
                        'For most Singapore savings accounts, this is around 0.05% p.a. — essentially nothing.',
                        'This is what you earn if you open an HYSA but never meet any of its conditions.',
                      ],
                      tip: 'The base rate alone is not worth chasing — the value of an HYSA comes entirely from the bonus tiers on top.',
                    },
                    {
                      icon: '⚡',
                      label: 'Bonus Interest',
                      sublabel: 'Unlocked by your actions',
                      color: '#F59E0B',
                      examples: ['Salary credit', 'Card spend', 'GIRO payments'],
                      details: [
                        'Bonus interest is added on top of the base rate when you meet specific monthly conditions.',
                        'Each condition unlocks an additional interest tier — the more you meet, the higher your rate.',
                        'Common conditions: credit your salary, spend a minimum on a linked card, set up a GIRO debit.',
                      ],
                      tip: 'Each bank structures its bonus tiers differently — DBS Multiplier rewards total transaction volume, while OCBC 360 and UOB One reward specific actions.',
                    },
                    {
                      icon: '🎯',
                      label: 'Effective Rate',
                      sublabel: 'What you actually earn',
                      color: '#059669',
                      examples: ['Base + all bonuses', 'Up to 7.65% p.a.', 'Applied to your balance'],
                      details: [
                        'Your effective rate is the sum of your base rate plus every bonus tier you qualify for.',
                        'This is the number that actually matters — and it varies month to month based on your behaviour.',
                        'Most students can realistically achieve 2–4% p.a. by meeting 2–3 conditions consistently.',
                      ],
                      tip: 'Check your bank app monthly — most HYSAs show a breakdown of which bonus tiers you qualified for and which you missed.',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Every HYSA has its own set of qualifying conditions. They all fall into the same three categories — here\'s what counts and how much each typically adds to your rate.',
                },
                {
                  type: 'table',
                  headers: ['Condition', 'What Counts', 'Typical Bonus Added'],
                  rows: [
                    ['Salary Credit', 'Monthly payroll credited via GIRO — must be labelled as salary', '+1.0% – 3.0% p.a.'],
                    ['Card Spend', 'Min. spend on the bank\'s credit or debit card (e.g. $500/month)', '+0.5% – 2.0% p.a.'],
                    ['GIRO Payments', 'At least 3 bill payments via GIRO (utilities, phone, insurance)', '+0.3% – 0.5% p.a.'],
                    ['Insurance / Investment', 'Buying an eligible insurance or investment product from the bank', '+1.0% – 2.4% p.a.'],
                  ],
                },
                {
                  type: 'flipcards',
                  title: 'Common HYSA mistakes → what to do instead:',
                  cards: [
                    {
                      frontLabel: '❌ Mistake',
                      backLabel: '✅ Fix',
                      front: 'Crediting your salary to a different bank from your HYSA.',
                      back: 'Always credit your salary to the same bank as your HYSA. Salary credit is the single biggest bonus tier — missing it can cost you 2–3% p.a.',
                      tag: 'Salary credit = biggest bonus',
                    },
                    {
                      frontLabel: '❌ Mistake',
                      backLabel: '✅ Fix',
                      front: 'Spending $500/month on a credit card from a different bank.',
                      back: 'Use the credit card linked to your HYSA bank. Spending on a DBS card counts toward DBS Multiplier — spending on an OCBC card doesn\'t.',
                      tag: 'Keep spending in the same ecosystem',
                    },
                    {
                      frontLabel: '❌ Mistake',
                      backLabel: '✅ Fix',
                      front: 'Assuming your HYSA interest rate is fixed every month.',
                      back: 'HYSA rates are recalculated monthly based on whether you met the conditions that month. Miss a condition in March, you lose that bonus in March only.',
                      tag: 'Rates reset monthly',
                    },
                    {
                      frontLabel: '❌ Mistake',
                      backLabel: '✅ Fix',
                      front: 'Keeping all your money in one account to maximise the HYSA balance.',
                      back: 'Most HYSAs only offer the highest rates on balances up to $75,000–$100,000. Beyond that, the rate drops — split excess into SSBs or fixed deposits.',
                      tag: 'Balance caps exist',
                    },
                  ],
                },
                {
                  type: 'scenarios',
                  title: 'What would you do?',
                  scenarios: [
                    {
                      icon: '🎓',
                      situation: 'You\'re a full-time student with no salary, spending about $400/month on your OCBC debit card. Your OCBC 360 is earning only the base rate of 0.05%.',
                      options: [
                        {
                          text: 'Switch to a digital bank like GXS or Trust for a better base rate.',
                          biasLabel: 'Smart move ✓',
                          biasExplanation: 'Without salary credit or card spend qualifying conditions, a digital bank\'s flat 2–3% rate beats the OCBC 360 base rate. Match the account to your situation.',
                          isIdeal: true,
                        },
                        {
                          text: 'Increase spending to $500/month to qualify for the card spend bonus.',
                          biasLabel: 'Risky approach',
                          biasExplanation: 'Spending more just to earn interest is counterproductive — the bonus earned rarely outweighs the extra spending required.',
                          isIdeal: false,
                        },
                        {
                          text: 'Do nothing — the difference is too small to matter.',
                          biasLabel: 'Costly inaction',
                          biasExplanation: 'On a $5,000 balance, the difference between 0.05% and 3% is $148/year — real money that compounds over time.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '💼',
                      situation: 'You\'ve just started a part-time internship paying $1,500/month. You have a UOB One account but have been crediting your pay to DBS.',
                      options: [
                        {
                          text: 'Continue crediting to DBS — it\'s easier.',
                          biasLabel: 'Missing out',
                          biasExplanation: 'UOB One\'s biggest bonus tier requires salary credit to UOB. Crediting elsewhere means you miss 1–2% p.a. in bonus interest every month.',
                          isIdeal: false,
                        },
                        {
                          text: 'Switch salary credit to UOB One and set up one GIRO bill payment.',
                          biasLabel: 'Best choice ✓',
                          biasExplanation: 'Salary credit + one GIRO unlocks UOB One\'s main bonus tiers — you could earn up to 3% p.a. on your balance with minimal effort.',
                          isIdeal: true,
                        },
                        {
                          text: 'Open a new DBS Multiplier account and credit salary there instead.',
                          biasLabel: 'Reasonable but slower',
                          biasExplanation: 'DBS Multiplier is a strong account but takes time to set up and optimise. If you already have UOB One, activating it first is the faster win.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '💰',
                      situation: 'You have $15,000 saved in your OCBC 360, earning 4% p.a. after meeting all conditions. You\'ve just saved an extra $10,000 from your internship.',
                      options: [
                        {
                          text: 'Add the $10,000 to your OCBC 360 to earn 4% on $25,000.',
                          biasLabel: 'Check the fine print',
                          biasExplanation: 'OCBC 360 offers the highest rates only on the first $75,000 — but check whether the bonus tiers apply equally across the full balance or just the first tranche.',
                          isIdeal: false,
                        },
                        {
                          text: 'Keep $15,000 in OCBC 360 and put the $10,000 into a Singapore Savings Bond.',
                          biasLabel: 'Smart split ✓',
                          biasExplanation: 'SSBs offer ~3% p.a. with zero risk and full government backing. Splitting across accounts diversifies your interest sources and keeps your HYSA conditions achievable.',
                          isIdeal: true,
                        },
                        {
                          text: 'Put the $10,000 in a fixed deposit for 6 months.',
                          biasLabel: 'Reasonable option',
                          biasExplanation: 'Fixed deposits offer certainty but lock up your money. SSBs are more flexible — redeemable any month with no penalty.',
                          isIdeal: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Let\'s make this concrete. Here\'s what a student who meets two HYSA conditions can realistically earn — compared to doing nothing.',
                },
                {
                  type: 'callout',
                  variant: 'tip',
                  text: 'Example: $10,000 in a UOB One account, salary credited + $500/month card spend = ~3% p.a. effective rate. That\'s $300/year — $25/month — just from meeting two conditions. The same balance in a basic account at 0.05% earns $5/year.',
                },
                {
                  type: 'text',
                  text: 'Now test your understanding of how HYSA interest actually works.',
                },
                {
                  type: 'tindertruefalse',
                  title: 'HYSA Interest — True or False?',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    {
                      text: 'HYSA bonus interest is automatically applied to your account every month regardless of your activity.',
                      isTrue: false,
                      explanation: 'Bonus interest must be earned by meeting specific conditions each month — salary credit, card spend, GIRO payments. Miss the conditions, miss the bonus.',
                    },
                    {
                      text: 'Crediting your salary to a different bank from your HYSA can cost you up to 3% p.a. in lost bonus interest.',
                      isTrue: true,
                      explanation: 'Salary credit is the highest-value condition for most HYSAs. Missing it — even by crediting to a different account — removes the biggest bonus tier.',
                    },
                    {
                      text: 'HYSA interest rates are fixed and do not change from month to month.',
                      isTrue: false,
                      explanation: 'Your effective rate is recalculated monthly based on which conditions you met. A good month earns the full rate; a missed condition means a lower rate that month.',
                    },
                    {
                      text: 'A student with no salary can still earn above-base interest on an HYSA by meeting card spend and GIRO conditions.',
                      isTrue: true,
                      explanation: 'Salary credit is the biggest bonus but not the only one. Card spend and GIRO conditions can still unlock 0.5–2% in additional interest even without a salary.',
                    },
                    {
                      text: 'Most HYSAs apply their highest interest rate equally across your entire account balance with no cap.',
                      isTrue: false,
                      explanation: 'Most HYSAs cap their highest rates at a certain balance — typically $50,000–$100,000. Amounts above the cap earn a lower rate, so splitting excess funds into SSBs or fixed deposits makes sense.',
                    },
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Current interest rates for DBS Multiplier, OCBC 360, and UOB One',
                  prompt: 'Current interest rates DBS Multiplier OCBC 360 UOB One Singapore 2025 conditions',
                },
              ],
              flashcards: [
                { q: 'What is a High-Yield Savings Account (HYSA)?', a: 'A savings account that earns significantly more than a standard account — but only when you meet specific monthly conditions like salary credit, card spend, or GIRO payments.' },
                { q: 'What is the base interest rate on most Singapore savings accounts?', a: 'Around 0.05% p.a. — essentially nothing. The real value of an HYSA comes from the bonus tiers on top.' },
                { q: 'What is the single most valuable condition to meet on most HYSAs?', a: 'Salary credit — crediting your monthly pay to the same bank as your HYSA unlocks the biggest bonus tier, often adding 1–3% p.a.' },
                { q: 'How often is HYSA bonus interest recalculated?', a: 'Monthly — if you miss a condition in a given month, you lose that bonus for that month only. It resets the following month.' },
                { q: 'What should you do with savings above an HYSA\'s balance cap?', a: 'Split excess funds into Singapore Savings Bonds or fixed deposits — most HYSAs only apply their highest rates up to $50,000–$100,000.' },
              ],
            },
            {
              id: '5-2', title: 'OCBC 360 vs UOB One vs DBS Multiplier', icon: '⚖️',
              topic: 'OCBC 360 UOB One DBS Multiplier comparison Singapore',
              duration: '7 min', xp: 80,
              sections: [{ key: 'compare', heading: 'Side-by-Side Comparison' }, { key: 'student', heading: 'Best Option for Students' }, { key: 'exercise', heading: 'Calculate Your Returns' }],
              content: [
                {
                  type: 'text',
                  text: 'DBS Multiplier, OCBC 360, and UOB One are Singapore\'s three most popular high-yield savings accounts. All three can earn significantly more than a basic account — but they reward different behaviours. The best one for you depends entirely on how you actually use your money.',
                },
                {
                  type: 'callout',
                  variant: 'tip',
                  text: 'Interest rates for all three accounts change periodically. The numbers in this lesson are illustrative — use the bot chip at the bottom to get today\'s exact rates and conditions before making a decision.',
                },
                {
                  type: 'text',
                  text: 'Here\'s how the three accounts compare at a glance — based on their published condition structures.',
                },
                {
                  type: 'table',
                  headers: ['Account', 'Key Condition', 'Illustrative Max Rate', 'Best For'],
                  rows: [
                    ['DBS Multiplier', 'Total monthly transactions across DBS products', 'Up to ~4.1% p.a.', 'DBS ecosystem users with salary + card spend'],
                    ['OCBC 360', 'Salary credit + card spend + GIRO + insurance/investment', 'Up to ~4.65% p.a.', 'Students who want savings pockets + goal tracking'],
                    ['UOB One', 'Salary credit + $500/month card spend + 3 GIRO payments', 'Up to ~4.0% p.a.', 'Students with consistent monthly card spend'],
                  ],
                },
                {
                  type: 'topiccards',
                  title: 'A closer look at each account:',
                  cards: [
                    {
                      icon: '🔴',
                      label: 'DBS Multiplier',
                      description: 'Rewards total transaction volume',
                      color: '#DC2626',
                      details: [
                        'Interest scales with your total monthly transactions across DBS products — salary, card spend, insurance, investments, home loan',
                        'The more DBS products you use, the higher your rate — no fixed minimum spend required',
                        'Integrates with DBS NAV Planner for spending and savings tracking in one app',
                      ],
                      example: 'A student who credits salary to DBS and spends on a DBS card could realistically earn 2–3% p.a. — check the bot for today\'s exact tiered rates.',
                    },
                    {
                      icon: '🟠',
                      label: 'OCBC 360',
                      description: 'Rewards specific monthly actions',
                      color: '#EA580C',
                      details: [
                        'Each condition unlocks a separate bonus tier — salary, card spend, GIRO, insurance/investment',
                        'Savings Pockets feature lets you create named sub-accounts for different goals within one account',
                        'Most student-friendly onboarding — low minimum balance and no fall-below fee for students',
                      ],
                      example: 'A student meeting salary credit + card spend conditions could earn 2.5–4% p.a. — use the bot chip below for current tier breakdowns.',
                    },
                    {
                      icon: '🔵',
                      label: 'UOB One',
                      description: 'Simple conditions, strong interest',
                      color: '#1D4ED8',
                      details: [
                        'Simpler structure than DBS Multiplier — meet salary + $500 card spend + 3 GIRO debits and you\'re done',
                        'Interest is applied in bands — different rates for the first $30,000, next $30,000, and so on',
                        'UOB TMRW app offers spending insights and savings nudges aimed at younger users',
                      ],
                      example: 'A student crediting salary and spending $500/month on a UOB card could earn 3–4% p.a. — check the bot for the latest band rates.',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'The right account depends on your situation right now — not which account has the highest headline rate. Here are three common student profiles.',
                },
                {
                  type: 'scenarios',
                  title: 'Which account fits your situation?',
                  scenarios: [
                    {
                      icon: '🎓',
                      situation: 'You\'re a full-time student with no salary yet, spending about $300–$400/month across various apps and cards.',
                      options: [
                        {
                          text: 'Open an OCBC 360 and focus on the card spend and GIRO tiers only.',
                          biasLabel: 'Smart starting point ✓',
                          biasExplanation: 'Without salary credit you can\'t unlock the biggest tier, but OCBC 360\'s card spend and GIRO bonuses are still achievable — and Savings Pockets helps you organise goals.',
                          isIdeal: true,
                        },
                        {
                          text: 'Open a DBS Multiplier and try to hit the transaction volume threshold.',
                          biasLabel: 'Harder without salary',
                          biasExplanation: 'DBS Multiplier rewards total transaction volume — without salary credit, it\'s hard to hit the thresholds that unlock meaningful bonus rates.',
                          isIdeal: false,
                        },
                        {
                          text: 'Use a digital bank like GXS or Trust for a flat 2–3% base rate instead.',
                          biasLabel: 'Also a good option',
                          biasExplanation: 'If you can\'t meet any HYSA conditions, a digital bank\'s flat rate beats the HYSA base rate of 0.05%. This is a perfectly reasonable choice until you have a salary.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '💼',
                      situation: 'You\'re on a 6-month internship earning $1,500/month and already spending $500+/month on your UOB card.',
                      options: [
                        {
                          text: 'Open a UOB One, credit your internship salary, and keep spending on your UOB card.',
                          biasLabel: 'Best match ✓',
                          biasExplanation: 'You already meet two of UOB One\'s three conditions — just add one GIRO payment (phone bill or transport) and you unlock the full bonus tier for the duration of your internship.',
                          isIdeal: true,
                        },
                        {
                          text: 'Switch everything to OCBC 360 to maximise conditions.',
                          biasLabel: 'Unnecessary disruption',
                          biasExplanation: 'Switching banks mid-internship means re-setting up salary credit and GIRO — UOB One is already the right fit given your existing UOB card spend.',
                          isIdeal: false,
                        },
                        {
                          text: 'Keep the money in your current basic savings account for simplicity.',
                          biasLabel: 'Costly inaction',
                          biasExplanation: 'On a $5,000 balance, the difference between 0.05% and 3% is ~$148/year. Six months of internship savings deserves a better home.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '🏢',
                      situation: 'You\'ve just started full-time work, salary credited to DBS, spending across multiple DBS products — card, insurance, home loan in the future.',
                      options: [
                        {
                          text: 'Open a DBS Multiplier and consolidate all transactions within the DBS ecosystem.',
                          biasLabel: 'Best long-term fit ✓',
                          biasExplanation: 'DBS Multiplier is designed exactly for this — it rewards total DBS transaction volume. The more DBS products you use, the higher your effective rate over time.',
                          isIdeal: true,
                        },
                        {
                          text: 'Switch to OCBC 360 for the higher headline rate.',
                          biasLabel: 'Headline vs reality',
                          biasExplanation: 'OCBC 360\'s headline rate requires meeting all conditions including insurance/investment products. If your ecosystem is DBS, switching adds friction without guaranteed benefit.',
                          isIdeal: false,
                        },
                        {
                          text: 'Split salary between DBS Multiplier and UOB One to diversify.',
                          biasLabel: 'Splitting dilutes conditions',
                          biasExplanation: 'Most HYSAs require salary credit to unlock their biggest tier — splitting your salary means neither account qualifies for the full bonus.',
                          isIdeal: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'flipcards',
                  title: 'What does each account realistically earn for a student?',
                  cards: [
                    {
                      frontLabel: '🔴 DBS Multiplier',
                      backLabel: '📊 Realistic student rate',
                      front: 'Key condition: Total monthly DBS transactions — salary + card spend + other DBS products.',
                      back: 'A student with salary credit + DBS card spend can realistically earn 2–3% p.a. Without salary credit, earning above base rate is difficult. Check the bot for today\'s exact tier thresholds.',
                      tag: 'Best when deeply in the DBS ecosystem',
                    },
                    {
                      frontLabel: '🟠 OCBC 360',
                      backLabel: '📊 Realistic student rate',
                      front: 'Key condition: Salary credit + card spend + GIRO + optional insurance/investment bonus.',
                      back: 'A student meeting salary + card spend + GIRO can earn 2.5–4% p.a. Without salary, card spend and GIRO tiers still add 0.5–1.5% above base. Savings Pockets adds non-financial value.',
                      tag: 'Most flexible for students at different stages',
                    },
                    {
                      frontLabel: '🔵 UOB One',
                      backLabel: '📊 Realistic student rate',
                      front: 'Key condition: Salary credit + min. $500/month card spend + 3 GIRO payments.',
                      back: 'A student meeting all three conditions can earn 3–4% p.a. The simplest condition structure of the three — if you already spend $500/month on a UOB card, this is the easiest HYSA to maximise.',
                      tag: 'Simplest to qualify for once employed',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Use the sliders below to estimate how much you could earn annually in each account. These figures are illustrative — based on published condition structures. Use the bot chip at the bottom for today\'s exact rates.',
                },
                {
                  type: 'slider',
                  icon: '🔴',
                  title: 'DBS Multiplier — Annual Interest Estimator',
                  description: 'Drag to your savings balance to see estimated annual interest (illustrative 2.5% p.a. for salary credit + card spend).',
                  min: 1000,
                  max: 50000,
                  step: 1000,
                  initialValue: 10000,
                  prefix: '$',
                  calculateResult: (balance) => [
                    { label: '💰 Estimated annual interest', value: `$${(balance * 0.025).toFixed(0)}`, color: '#DC2626' },
                    { label: '📅 Monthly earnings', value: `$${(balance * 0.025 / 12).toFixed(2)}`, color: '#4F46E5' },
                    { label: '📈 vs basic account (0.05%)', value: `+$${(balance * 0.025 - balance * 0.0005).toFixed(0)}/year more`, color: '#059669' },
                  ],
                },
                {
                  type: 'slider',
                  icon: '🟠',
                  title: 'OCBC 360 — Annual Interest Estimator',
                  description: 'Drag to your savings balance to see estimated annual interest (illustrative 3% p.a. for salary + card spend + GIRO).',
                  min: 1000,
                  max: 50000,
                  step: 1000,
                  initialValue: 10000,
                  prefix: '$',
                  calculateResult: (balance) => [
                    { label: '💰 Estimated annual interest', value: `$${(balance * 0.03).toFixed(0)}`, color: '#EA580C' },
                    { label: '📅 Monthly earnings', value: `$${(balance * 0.03 / 12).toFixed(2)}`, color: '#4F46E5' },
                    { label: '📈 vs basic account (0.05%)', value: `+$${(balance * 0.03 - balance * 0.0005).toFixed(0)}/year more`, color: '#059669' },
                  ],
                },
                {
                  type: 'slider',
                  icon: '🔵',
                  title: 'UOB One — Annual Interest Estimator',
                  description: 'Drag to your savings balance to see estimated annual interest (illustrative 3.5% p.a. for salary + $500 spend + 3 GIRO).',
                  min: 1000,
                  max: 50000,
                  step: 1000,
                  initialValue: 10000,
                  prefix: '$',
                  calculateResult: (balance) => [
                    { label: '💰 Estimated annual interest', value: `$${(balance * 0.035).toFixed(0)}`, color: '#1D4ED8' },
                    { label: '📅 Monthly earnings', value: `$${(balance * 0.035 / 12).toFixed(2)}`, color: '#4F46E5' },
                    { label: '📈 vs basic account (0.05%)', value: `+$${(balance * 0.035 - balance * 0.0005).toFixed(0)}/year more`, color: '#059669' },
                  ],
                },
                {
                  type: 'text',
                  text: 'Now test your understanding of how these three accounts compare.',
                },
                {
                  type: 'tindertruefalse',
                  title: 'HYSA Comparison — True or False?',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    {
                      text: 'DBS Multiplier rewards total transaction volume across DBS products — not just salary credit alone.',
                      isTrue: true,
                      explanation: 'Unlike OCBC 360 and UOB One which have fixed condition categories, DBS Multiplier rewards the total value of your monthly transactions across all DBS products.',
                    },
                    {
                      text: 'A student with no salary cannot earn any bonus interest on any of the three HYSAs.',
                      isTrue: false,
                      explanation: 'OCBC 360 and UOB One both have card spend and GIRO tiers that don\'t require salary credit — students can still earn above-base rates by meeting these conditions.',
                    },
                    {
                      text: 'Splitting your salary between two HYSAs is a good way to maximise interest from both accounts.',
                      isTrue: false,
                      explanation: 'Most HYSAs require full salary credit to unlock their biggest bonus tier. Splitting your salary means neither account qualifies — concentrate your salary in one account.',
                    },
                    {
                      text: 'UOB One has the simplest qualifying conditions of the three accounts.',
                      isTrue: true,
                      explanation: 'UOB One\'s three conditions — salary credit, $500/month card spend, and 3 GIRO payments — are clearly defined and easier to track than DBS Multiplier\'s transaction volume tiers.',
                    },
                    {
                      text: 'HYSA interest rates are guaranteed and will not change after you open the account.',
                      isTrue: false,
                      explanation: 'HYSA rates are set by the banks and can change at any time — they are not guaranteed. Always check your bank\'s current published rates before making decisions.',
                    },
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Current interest rates for DBS Multiplier, OCBC 360, and UOB One',
                  prompt: 'Current interest rates and qualifying conditions for DBS Multiplier, OCBC 360, and UOB One Singapore 2025',
                },
              ],
              flashcards: [
                { q: 'What is the key qualifying condition for UOB One?', a: 'Salary credit + minimum $500/month card spend + 3 GIRO payments — meet all three to unlock the full bonus rate.' },
                { q: 'What makes DBS Multiplier different from OCBC 360 and UOB One?', a: 'DBS Multiplier rewards total transaction volume across all DBS products — the more DBS services you use, the higher your rate. The others have fixed condition categories.' },
                { q: 'Which HYSA is most suitable for a student with no salary yet?', a: 'OCBC 360 — its card spend and GIRO tiers are achievable without salary credit, and Savings Pockets help with goal tracking.' },
                { q: 'What is a realistic effective rate for a student meeting 2–3 HYSA conditions?', a: 'Roughly 2–4% p.a. depending on the account and conditions met — significantly better than the 0.05% base rate.' },
                { q: 'Why should you check your HYSA rate every month?', a: 'HYSA rates are recalculated monthly based on whether you met the conditions. Miss a condition, you lose that bonus for that month only.' },
              ],
            },
            {
              id: '5-3', title: 'Maximising Your Interest', icon: '🔑',
              topic: 'Maximising bank interest Singapore student strategies',
              duration: '5 min', xp: 80,
              sections: [{ key: 'stack', heading: 'Stacking Interest Conditions' }, { key: 'automate', heading: 'Automating for Passive Gains' }, { key: 'review', heading: 'Annual Account Review' }],
              content: [
                {
                  type: 'text',
                  text: 'Earning high interest isn\'t about finding the best account — every student has already heard about DBS Multiplier, OCBC 360, and UOB One. The difference between students who actually earn 3–4% p.a. and those stuck at 0.05% is one thing: consistently meeting conditions. This lesson is about building the system that makes that happen automatically.',
                },
                {
                  type: 'callout',
                  variant: 'fact',
                  text: 'Studies on consumer banking behaviour show that most account holders who open HYSAs never fully maximise their bonus tiers — they set up the account once and forget to optimise their behaviour around it.',
                },
                {
                  type: 'keyterm',
                  term: 'Interest Stacking',
                  definition: 'Deliberately structuring your financial behaviour — salary credit, card spend, GIRO payments — to meet multiple HYSA bonus tiers simultaneously, maximising your effective interest rate every month.',
                },
                {
                  type: 'text',
                  text: 'There are three levers you can pull to maximise your HYSA rate. Each one unlocks a different bonus tier — and the best part is that all three can be set up once and run automatically.',
                },
                {
                  type: 'timeline',
                  title: 'The three interest-stacking levers:',
                  nodes: [
                    {
                      icon: '💰',
                      label: 'Salary Credit',
                      sublabel: 'Biggest single lever',
                      color: '#4F46E5',
                      examples: ['Credit full salary to HYSA', 'Must be labelled as salary', 'Payroll GIRO only'],
                      details: [
                        'Salary credit is the single most valuable condition across all three HYSAs — unlocking 1–3% p.a. in bonus interest alone.',
                        'Your salary must be credited via payroll GIRO and labelled as salary — manual transfers don\'t count.',
                        'Set this up once with your HR department and it runs automatically every month.',
                      ],
                      tip: 'When starting a new job, the first thing you do is tell HR to credit your salary to your HYSA — not your everyday account.',
                    },
                    {
                      icon: '💳',
                      label: 'Spend Optimisation',
                      sublabel: 'Use the right card',
                      color: '#0891B2',
                      examples: ['$500/month minimum', 'Use linked bank card', 'Consolidate daily spend'],
                      details: [
                        'Card spend bonuses require you to spend a minimum amount — typically $500/month — on the bank\'s linked credit or debit card.',
                        'The key is consolidation — route all your regular spending (groceries, transport, subscriptions) through one card.',
                        'You\'re already spending this money — the only change is which card you use.',
                      ],
                      tip: 'Set your linked card as the default payment method in GrabPay, Shopee, and your phone\'s wallet. Passive spend accumulation with zero extra effort.',
                    },
                    {
                      icon: '🔄',
                      label: 'GIRO Setup',
                      sublabel: 'Easiest wins',
                      color: '#059669',
                      examples: ['Phone bill', 'Utilities / SP Group', 'Insurance premium'],
                      details: [
                        'Most HYSAs require 3 GIRO payments per month — these are recurring automatic deductions from your account.',
                        'Phone bill, internet, utilities, and insurance premiums all count — set them up once and they qualify every month automatically.',
                        'This is the lowest-effort condition to meet — most students already have eligible bills, they just haven\'t linked them to GIRO.',
                      ],
                      tip: 'Log into your bank app and set up GIRO for your phone bill, SP Group utilities, and one insurance premium. Done in 15 minutes, qualifies every month forever.',
                    },
                  ],
                },
                {
                  type: 'checklist',
                  title: '✅ Your interest-stacking setup checklist:',
                  items: [
                    'Tell HR to credit your salary to your HYSA via payroll GIRO — not your everyday account.',
                    'Set your HYSA\'s linked credit or debit card as your default payment method for daily spending.',
                    'Set up GIRO for at least 3 recurring bills — phone, utilities, and insurance are the easiest.',
                    'Enable monthly interest breakdown notifications in your bank app so you know which tiers you hit.',
                    'Set a calendar reminder for the last week of each month to check if you\'ve met your spend threshold.',
                  ],
                },
                {
                  type: 'text',
                  text: 'The goal is to make interest maximisation require zero monthly decision-making. Once your salary credit, GIRO payments, and card spend are set up correctly, your HYSA runs on autopilot.',
                },
                {
                  type: 'scenarios',
                  title: 'Should you automate, adjust, or restructure?',
                  scenarios: [
                    {
                      icon: '📱',
                      situation: 'You meet all three HYSA conditions every month but you manually transfer your salary from DBS to OCBC 360 each payday because your salary is credited to DBS.',
                      options: [
                        {
                          text: 'Keep doing the manual transfer — it only takes 2 minutes.',
                          biasLabel: 'Risk of missing months',
                          biasExplanation: 'Manual processes break down — travel, illness, or simply forgetting means you miss the salary credit condition and lose the biggest bonus tier that month.',
                          isIdeal: false,
                        },
                        {
                          text: 'Ask HR to change your payroll GIRO to credit directly to OCBC 360.',
                          biasLabel: 'Best fix ✓',
                          biasExplanation: 'One HR form eliminates the manual step permanently. Direct payroll GIRO also ensures the transfer is labelled as salary — which a manual transfer may not be.',
                          isIdeal: true,
                        },
                        {
                          text: 'Switch to DBS Multiplier instead since your salary is already in DBS.',
                          biasLabel: 'Also reasonable',
                          biasExplanation: 'If your entire banking ecosystem is DBS, switching to DBS Multiplier removes the friction entirely. But if OCBC 360 suits you better, fixing the payroll is the cleaner solution.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '💸',
                      situation: 'You\'re consistently $50–$80 short of the $500/month card spend threshold on your UOB One account. Last month you missed the bonus tier.',
                      options: [
                        {
                          text: 'Spend an extra $50–$80 on things you don\'t need to hit the threshold.',
                          biasLabel: 'Counterproductive',
                          biasExplanation: 'Spending $80 extra to earn ~$15 in bonus interest is a net loss. Never spend more than you would otherwise just to chase an interest condition.',
                          isIdeal: false,
                        },
                        {
                          text: 'Route existing subscriptions (Netflix, Spotify, phone plan) to your UOB card.',
                          biasLabel: 'Smart consolidation ✓',
                          biasExplanation: 'You\'re already paying for these — moving them to your UOB card costs nothing and adds $30–$80/month in qualifying spend without any extra outlay.',
                          isIdeal: true,
                        },
                        {
                          text: 'Switch to OCBC 360 which has a lower spend threshold.',
                          biasLabel: 'Drastic for a small gap',
                          biasExplanation: 'Switching banks has setup costs and disruption. Consolidating existing subscriptions to your UOB card is faster and solves the problem without changing accounts.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '🔍',
                      situation: 'You set up your HYSA 18 months ago and haven\'t reviewed it since. Your bank has updated its conditions twice in that period.',
                      options: [
                        {
                          text: 'Assume nothing has changed — you\'ve been earning interest so it must be fine.',
                          biasLabel: 'Risky assumption',
                          biasExplanation: 'Banks change HYSA conditions regularly. You may be meeting old conditions that no longer qualify, or missing new conditions that could earn you more.',
                          isIdeal: false,
                        },
                        {
                          text: 'Do a 30-minute annual review — check current conditions, your monthly breakdown, and whether a competitor account now offers better terms.',
                          biasLabel: 'Best practice ✓',
                          biasExplanation: 'A 30-minute annual review can identify missed conditions, rate changes, or better alternatives. On a $20,000 balance, finding an extra 1% p.a. is worth $200/year.',
                          isIdeal: true,
                        },
                        {
                          text: 'Switch banks immediately to whoever has the highest headline rate right now.',
                          biasLabel: 'Headline rates mislead',
                          biasExplanation: 'Headline rates require all conditions to be met. A review helps you understand what you can realistically earn — switching impulsively often results in worse outcomes.',
                          isIdeal: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'flipcards',
                  title: 'Set-and-forget mistakes → one-time fixes:',
                  cards: [
                    {
                      frontLabel: '❌ Mistake',
                      backLabel: '✅ One-time fix',
                      front: 'Your salary is credited to your HYSA but your daily spending card is from a different bank — so you never hit the card spend threshold.',
                      back: 'Order the linked debit or credit card from your HYSA bank and set it as your default. One card switch, permanent fix.',
                      tag: 'One card change unlocks a whole tier',
                    },
                    {
                      frontLabel: '❌ Mistake',
                      backLabel: '✅ One-time fix',
                      front: 'You pay your phone bill, utilities, and insurance manually each month — none of them are set up as GIRO.',
                      back: 'Log into each provider\'s website and set up GIRO to deduct from your HYSA. Takes 20 minutes total, qualifies automatically every month from then on.',
                      tag: '20 minutes of setup = lifetime qualification',
                    },
                    {
                      frontLabel: '❌ Mistake',
                      backLabel: '✅ One-time fix',
                      front: 'You check your interest earned at year-end and only then realise you\'ve been missing a condition for months.',
                      back: 'Enable monthly interest breakdown push notifications in your bank app. You\'ll know within days of month-end exactly which tiers you hit and which you missed.',
                      tag: 'Notifications = instant feedback loop',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Banks revise HYSA conditions and rates more often than most people realise. A 30-minute annual account review is one of the highest-value financial habits you can build — here\'s what it could be worth.',
                },
                {
                  type: 'slider',
                  icon: '🔑',
                  title: 'How much are you leaving on the table?',
                  description: 'Drag to your current savings balance to see the annual difference between earning the base rate and a realistic optimised rate.',
                  min: 1000,
                  max: 75000,
                  step: 1000,
                  initialValue: 15000,
                  prefix: '$',
                  calculateResult: (balance) => [
                    { label: '😴 Basic account (0.05% p.a.)', value: `$${(balance * 0.0005).toFixed(0)}/year`, color: '#9CA3AF' },
                    { label: '✅ Optimised HYSA (~3% p.a.)', value: `$${(balance * 0.03).toFixed(0)}/year`, color: '#059669' },
                    { label: `💸 You're leaving on the table`, value: `$${(balance * 0.03 - balance * 0.0005).toFixed(0)}/year`, color: '#DC2626' },
                  ],
                },
                {
                  type: 'text',
                  text: 'Now test your understanding of interest maximisation strategies.',
                },
                {
                  type: 'tindertruefalse',
                  title: 'Maximising Interest — True or False?',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    {
                      text: 'Spending extra money you wouldn\'t otherwise spend is a good strategy to hit a card spend threshold.',
                      isTrue: false,
                      explanation: 'Spending $80 extra to earn $15 in bonus interest is a net loss. Always consolidate existing spending to hit thresholds — never manufacture new spending.',
                    },
                    {
                      text: 'Setting up GIRO for recurring bills is one of the easiest HYSA conditions to automate.',
                      isTrue: true,
                      explanation: 'Phone, utilities, and insurance GIRO payments qualify for most HYSAs\' GIRO conditions — set them up once and they run automatically every month.',
                    },
                    {
                      text: 'A manual salary transfer from one bank to your HYSA counts the same as payroll GIRO for salary credit conditions.',
                      isTrue: false,
                      explanation: 'Most banks require salary to be credited via payroll GIRO and labelled as salary. A manual transfer may not be recognised as salary credit — always confirm with your bank.',
                    },
                    {
                      text: 'HYSA conditions and rates are fixed once you open the account and will not change.',
                      isTrue: false,
                      explanation: 'Banks revise HYSA conditions and rates regularly. An annual review helps you stay current and ensure you\'re still meeting the right conditions for the best rate.',
                    },
                    {
                      text: 'Routing existing subscriptions like Netflix and Spotify to your HYSA\'s linked card is a cost-free way to increase qualifying card spend.',
                      isTrue: true,
                      explanation: 'You\'re already paying for these subscriptions — switching the payment card costs nothing and adds to your monthly qualifying spend without any extra outlay.',
                    },
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Have any HYSA conditions or rates changed recently?',
                  prompt: 'Latest changes to DBS Multiplier OCBC 360 UOB One conditions interest rates Singapore 2025',
                },
              ],
              flashcards: [
                { q: 'What is interest stacking?', a: 'Deliberately structuring your behaviour — salary credit, card spend, GIRO — to meet multiple HYSA bonus tiers simultaneously and maximise your effective rate.' },
                { q: 'What is the single most valuable HYSA condition to meet?', a: 'Salary credit — it unlocks the biggest bonus tier (1–3% p.a.) across all three major HYSAs. Always credit your salary to your HYSA bank.' },
                { q: 'How do you hit the card spend threshold without spending more money?', a: 'Consolidate existing spending — groceries, transport, subscriptions — onto your HYSA\'s linked card. Route what you already spend through one card.' },
                { q: 'Why should you do an annual HYSA review?', a: 'Banks change conditions and rates regularly. A 30-minute review can identify missed conditions or better alternatives — on $20,000, finding 1% more is worth $200/year.' },
                { q: 'What is the easiest HYSA condition to automate permanently?', a: 'GIRO payments — set up your phone bill, utilities, and insurance to deduct from your HYSA once, and they qualify automatically every month.' },
              ],
            },
          ],
        },
        {
          id: 'chapter-6',
          title: 'SSBs & Fixed Deposits',
          icon: '📜',
          description: 'Safe, government-backed options for your savings',
          lessons: [
            {
              id: '6-1', title: 'Singapore Savings Bonds Explained', icon: '🇸🇬',
              topic: 'Singapore Savings Bond SSB how it works',
              duration: '6 min', xp: 80,
              sections: [{ key: 'what', heading: 'What Are SSBs?' }, { key: 'how', heading: 'How to Apply' }, { key: 'when', heading: 'When SSBs Make Sense' }],
              content: [
                {
                  type: 'text',
                  text: 'Singapore Savings Bonds are one of the best-kept secrets in personal finance for Singapore residents. Government-backed, flexible, and consistently competitive rates — yet most students have never considered them. If you have a lump sum sitting in a basic savings account earning 0.05%, SSBs are worth understanding.',
                },
                {
                  type: 'callout',
                  variant: 'fact',
                  text: 'SSBs are issued by the Singapore government via MAS — they carry zero default risk. In over 50 years of independence, Singapore has never defaulted on a financial obligation. SSBs are the safest investment instrument available to retail investors in Singapore.',
                },
                {
                  type: 'keyterm',
                  term: 'Singapore Savings Bond (SSB)',
                  definition: 'A retail savings instrument issued monthly by the Singapore government. Offers step-up interest over 10 years, full capital protection, and penalty-free redemption any month — with a minimum investment of $500.',
                },
                {
                  type: 'text',
                  text: 'SSBs sit in a unique position — safer than a savings account in terms of issuer risk, more flexible than a fixed deposit, and competitive with HYSAs for lump sum savings. Here\'s how the three core features work.',
                },
                {
                  type: 'timeline',
                  title: 'The three features that make SSBs unique:',
                  nodes: [
                    {
                      icon: '📈',
                      label: 'Step-Up Interest',
                      sublabel: 'Earn more each year',
                      color: '#4F46E5',
                      examples: ['Year 1: ~2.5% p.a.', 'Year 5: ~3.0% p.a.', 'Year 10: ~3.2% p.a.'],
                      details: [
                        'SSB interest increases every year you hold the bond — the longer you stay, the more you earn.',
                        'Interest is paid out every 6 months directly to your bank account — you don\'t need to wait until maturity.',
                        'The average rate over 10 years is typically competitive with or better than fixed deposits.',
                      ],
                      tip: 'Check the MAS website each month for the current SSB tranche\'s interest schedule — rates vary by issue and are fixed at the time of application.',
                    },
                    {
                      icon: '🛡️',
                      label: 'Capital Protection',
                      sublabel: 'Get back exactly what you put in',
                      color: '#059669',
                      examples: ['Zero default risk', 'Government-guaranteed', 'No market risk'],
                      details: [
                        'SSBs are backed by the full faith and credit of the Singapore government — your principal is 100% protected.',
                        'Unlike stocks or unit trusts, SSB values do not fluctuate — you will always get back exactly what you invested.',
                        'This makes SSBs ideal for money you cannot afford to lose, such as an emergency fund top-up or a savings goal.',
                      ],
                      tip: 'SSBs are not SDIC-insured — they don\'t need to be. Being government-issued means they carry a higher guarantee than any bank deposit insurance scheme.',
                    },
                    {
                      icon: '🔓',
                      label: 'Full Flexibility',
                      sublabel: 'Redeem any month, no penalty',
                      color: '#F59E0B',
                      examples: ['Redeem in any month', 'No lock-in period', 'No early redemption fee'],
                      details: [
                        'Unlike fixed deposits which lock up your money, SSBs can be redeemed in any month with no penalty.',
                        'Submit a redemption request by the 4th last business day of the month — funds arrive in your account by the 2nd business day of the following month.',
                        'You keep all interest earned up to the point of redemption — there is no penalty for leaving early.',
                      ],
                      tip: 'The 10-year tenor is the maximum, not a commitment. Think of an SSB like a savings account that earns more the longer you leave it — but you can always take your money out.',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'How do SSBs compare to the other savings instruments you already know? Here\'s a side-by-side breakdown.',
                },
                {
                  type: 'table',
                  headers: ['Feature', 'SSB', 'Fixed Deposit', 'HYSA'],
                  rows: [
                    ['Issued by', 'Singapore Government', 'Commercial bank', 'Commercial bank'],
                    ['Default risk', 'Zero', 'Low (SDIC up to $75k)', 'Low (SDIC up to $75k)'],
                    ['Minimum investment', '$500', '$1,000–$10,000', '$0'],
                    ['Liquidity', 'Redeem any month', 'Locked until maturity', 'Fully liquid'],
                    ['Interest rate', 'Step-up, ~2.5–3.5% p.a.', 'Fixed, ~2.5–3.5% p.a.', 'Up to ~4.65% with conditions'],
                    ['Interest payment', 'Every 6 months to bank', 'At maturity', 'Monthly'],
                    ['Early exit penalty', 'None', 'Lose all interest', 'None'],
                    ['Maximum investment', '$200,000 per person', 'No limit', 'No limit'],
                  ],
                },
                {
                  type: 'text',
                  text: 'Buying an SSB is straightforward — but there are a few steps to set up before your first application.',
                },
                {
                  type: 'steps',
                  title: 'How to buy your first SSB:',
                  steps: [
                    'Open a CDP (Central Depository) account at SGX — free, takes 3–5 business days. You need a CDP account to hold SSBs.',
                    'Link your CDP account to your bank account (DBS, OCBC, or UOB) via internet banking.',
                    'Check the current month\'s SSB tranche on the MAS website — note the interest rate schedule and closing date.',
                    'Apply via your bank\'s internet banking or ATM — select "Singapore Savings Bonds" and enter your desired amount (min. $500, multiples of $500).',
                    'Wait for allotment — results are announced after the application closes. You may receive less than requested if the tranche is oversubscribed.',
                    'Interest is credited to your linked bank account every 6 months automatically.',
                  ],
                },
                {
                  type: 'callout',
                  variant: 'tip',
                  text: 'Singapore Tip: SSBs are frequently oversubscribed — especially in months with attractive rates. Apply for slightly more than you want, as allotment may be less than your full request. You are never charged for the unallotted amount.',
                },
                {
                  type: 'flipcards',
                  title: 'Common SSB misconceptions → the reality:',
                  cards: [
                    {
                      frontLabel: '❌ Misconception',
                      backLabel: '✅ Reality',
                      front: '"SSBs lock up my money for 10 years — I can\'t afford to tie up my savings that long."',
                      back: 'The 10-year tenor is the maximum, not a commitment. You can redeem in any month with no penalty and keep all interest earned. Think of it as a flexible savings account that rewards patience.',
                      tag: 'Redeem any month, no penalty',
                    },
                    {
                      frontLabel: '❌ Misconception',
                      backLabel: '✅ Reality',
                      front: '"SSBs are complicated investments — I need to know a lot about bonds before buying one."',
                      back: 'SSBs are specifically designed for retail investors with no investment experience. There is no market risk, no price fluctuation, and no complex terms — you put in $500 and get back $500 plus interest.',
                      tag: 'Simplest investment product in Singapore',
                    },
                    {
                      frontLabel: '❌ Misconception',
                      backLabel: '✅ Reality',
                      front: '"I should wait for interest rates to go up before buying an SSB."',
                      back: 'Trying to time SSB rates is counterproductive — money sitting in a 0.05% savings account while you wait is losing value. Apply for what makes sense now and redeem and reapply if rates improve significantly.',
                      tag: 'Idle cash always loses to SSB rates',
                    },
                    {
                      frontLabel: '❌ Misconception',
                      backLabel: '✅ Reality',
                      front: '"As an international student, I can\'t buy SSBs — they\'re only for Singaporeans."',
                      back: 'SSBs are available to all Singapore residents aged 18 and above — including international students on a valid student pass. You just need a CDP account and a local bank account.',
                      tag: 'Available to all Singapore residents',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'SSBs aren\'t the right tool for every situation — but when the conditions are right, they\'re hard to beat. Here are three common student scenarios.',
                },
                {
                  type: 'scenarios',
                  title: 'Does an SSB make sense here?',
                  scenarios: [
                    {
                      icon: '🛡️',
                      situation: 'You\'ve built a $3,000 emergency fund sitting in a basic savings account earning 0.05%. You\'re unlikely to need it in the next few months.',
                      options: [
                        {
                          text: 'Keep it in the basic savings account — it\'s already set up and accessible.',
                          biasLabel: 'Costly inaction',
                          biasExplanation: 'On $3,000 at 0.05%, you earn $1.50/year. An SSB at ~3% earns $90/year — with the same flexibility. There\'s no reason to leave emergency funds in a basic account.',
                          isIdeal: false,
                        },
                        {
                          text: 'Move $2,000 to an SSB and keep $1,000 in a liquid savings account for immediate access.',
                          biasLabel: 'Smart split ✓',
                          biasExplanation: 'SSBs take about a month to redeem — keeping $1,000 liquid covers immediate emergencies while the $2,000 in SSB earns significantly more. Best of both worlds.',
                          isIdeal: true,
                        },
                        {
                          text: 'Put all $3,000 in an SSB since you can redeem any month.',
                          biasLabel: 'Slightly risky',
                          biasExplanation: 'SSB redemption takes up to one month to process — in a true emergency, a one-month wait could be a problem. Always keep some portion in an instantly liquid account.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '🧧',
                      situation: 'You received $800 in ang bao money during Chinese New Year and want to put it to work. You won\'t need it for at least 12 months.',
                      options: [
                        {
                          text: 'Put it in an HYSA — you already have one set up.',
                          biasLabel: 'Good option',
                          biasExplanation: 'If your HYSA is earning 3%+ with conditions already met, this is perfectly reasonable. But if your HYSA conditions aren\'t met, the base rate is only 0.05% — worse than an SSB.',
                          isIdeal: false,
                        },
                        {
                          text: 'Apply for an SSB with the full $800 — minimum is $500, and you can apply in multiples of $500.',
                          biasLabel: 'Best use of a windfall ✓',
                          biasExplanation: 'A lump sum you won\'t need for 12+ months is exactly what SSBs are designed for. Government-backed, ~3% p.a., and redeemable if plans change. Perfect windfall vehicle.',
                          isIdeal: true,
                        },
                        {
                          text: 'Wait and save until you have $5,000 before investing.',
                          biasLabel: 'Opportunity cost',
                          biasExplanation: 'There\'s no reason to wait — SSBs accept from $500. Every month you wait, your $800 earns nothing. Apply now and add to it when you have more.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '⚖️',
                      situation: 'You have $5,000 to save for 6 months. You\'re comparing a 6-month fixed deposit at 3% p.a. vs an SSB at ~3% p.a. average.',
                      options: [
                        {
                          text: 'Choose the fixed deposit — same rate, simpler process.',
                          biasLabel: 'Reasonable but inflexible',
                          biasExplanation: 'Fixed deposits lock your money — if you need it before maturity, you lose all interest. For a 6-month horizon, the SSB\'s flexibility is a meaningful advantage at the same rate.',
                          isIdeal: false,
                        },
                        {
                          text: 'Choose the SSB — same rate, but you can redeem early with no penalty if plans change.',
                          biasLabel: 'Better risk-adjusted choice ✓',
                          biasExplanation: 'When rates are equal, flexibility always wins. The SSB gives you the same return as the fixed deposit but lets you exit without penalty if your plans change — a free option.',
                          isIdeal: true,
                        },
                        {
                          text: 'Split $2,500 into each — diversify between the two products.',
                          biasLabel: 'Unnecessary complexity',
                          biasExplanation: 'Both products carry minimal risk. Splitting adds no meaningful diversification benefit — if the rates are equal, the SSB\'s flexibility makes it the better choice for the full amount.',
                          isIdeal: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'tindertruefalse',
                  title: 'Singapore Savings Bonds — True or False?',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    {
                      text: 'SSBs are issued by the Singapore government and carry zero default risk.',
                      isTrue: true,
                      explanation: 'SSBs are backed by the full faith and credit of the Singapore government — the same entity that has never defaulted on a financial obligation in over 50 years.',
                    },
                    {
                      text: 'You must hold an SSB for the full 10-year tenor to receive your interest.',
                      isTrue: false,
                      explanation: 'SSB interest is paid every 6 months to your bank account. You can redeem in any month and keep all interest earned up to that point — the 10-year tenor is the maximum, not a requirement.',
                    },
                    {
                      text: 'International students on a valid student pass are eligible to buy SSBs in Singapore.',
                      isTrue: true,
                      explanation: 'SSBs are available to all Singapore residents aged 18 and above — including international students. You need a CDP account and a local bank account to apply.',
                    },
                    {
                      text: 'SSB interest rates are fixed for life at the time of purchase and never change.',
                      isTrue: true,
                      explanation: 'Once you buy an SSB, your interest rate schedule is locked in for the life of that bond. New tranches may have different rates, but your existing SSB is unaffected by rate changes.',
                    },
                    {
                      text: 'You can invest an unlimited amount in SSBs — there is no maximum per person.',
                      isTrue: false,
                      explanation: 'Each person can hold a maximum of $200,000 in SSBs at any one time. For most students this is not a constraint, but it\'s worth knowing the limit exists.',
                    },
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Current SSB interest rates and latest tranche details',
                  prompt: 'Singapore Savings Bond current interest rates latest tranche allotment results MAS 2025',
                },
              ],
              flashcards: [
                { q: 'Who issues Singapore Savings Bonds?', a: 'The Singapore government via MAS — they carry zero default risk and are the safest retail investment instrument in Singapore.' },
                { q: 'What is the minimum investment for an SSB?', a: '$500, in multiples of $500. The maximum any one person can hold is $200,000.' },
                { q: 'Can you redeem an SSB before the 10-year tenor ends?', a: 'Yes — SSBs can be redeemed in any month with no penalty. You keep all interest earned up to the point of redemption.' },
                { q: 'How is SSB interest paid?', a: 'Every 6 months, directly credited to your linked bank account — you don\'t need to wait until maturity.' },
                { q: 'Are international students in Singapore eligible to buy SSBs?', a: 'Yes — SSBs are available to all Singapore residents aged 18 and above, including those on a valid student pass.' },
              ],
            },
            {
              id: '6-2', title: 'Fixed Deposits in Singapore', icon: '🔒',
              topic: 'Fixed deposit Singapore banks rates comparison',
              duration: '5 min', xp: 80,
              sections: [{ key: 'what', heading: 'How Fixed Deposits Work' }, { key: 'rates', heading: 'Current Rates' }, { key: 'vs', heading: 'FD vs SSB vs HYSA' }],
              content: [
                {
                  type: 'text',
                  text: 'Fixed deposits are the simplest savings instrument in Singapore. You lock away a lump sum for a fixed period and earn a guaranteed rate. No conditions to meet, no spending thresholds, no ecosystem to buy into — just a rate and a term. The trade-off is liquidity: your money is locked until maturity.',
                },
                {
                  type: 'keyterm',
                  term: 'Fixed Deposit (FD)',
                  definition: 'A savings instrument where you deposit a lump sum for a fixed term — typically 1 to 36 months — at a guaranteed interest rate. You cannot access the funds without penalty until the term ends.',
                },
                {
                  type: 'text',
                  text: 'Fixed deposits work in three stages — choosing your term, locking in your rate, and deciding what happens at maturity.',
                },
                {
                  type: 'timeline',
                  title: 'How a fixed deposit works:',
                  nodes: [
                    {
                      icon: '📅',
                      label: 'Choose Your Term',
                      sublabel: 'Longer = higher rate',
                      color: '#4F46E5',
                      examples: ['1 month', '3–6 months', '12–24 months'],
                      details: [
                        'FD terms typically range from 1 month to 36 months — the longer the term, the higher the rate offered.',
                        'Most students opt for 3–12 month terms to balance rate and flexibility.',
                        'Promotional rates are often available for specific tenors — banks frequently run limited-time offers on 3 or 6 month FDs.',
                      ],
                      tip: 'Only lock away money you are confident you won\'t need for the full term. If there\'s any chance you\'ll need it early, an SSB is a better choice.',
                    },
                    {
                      icon: '🔒',
                      label: 'Lock In Your Rate',
                      sublabel: 'Guaranteed at placement',
                      color: '#0891B2',
                      details: [
                        'Your interest rate is fixed at the time you place the deposit — market rate changes after that date do not affect your FD.',
                        'This is both a strength and a weakness: if rates rise after you lock in, you miss out. If rates fall, you\'re protected.',
                        'FD rates are quoted per annum — a 3% p.a. rate on a 6-month FD earns approximately 1.5% for that 6-month period.',
                      ],
                      examples: ['Rate fixed at placement', 'Immune to rate cuts', 'Miss rate rises'],
                      tip: 'If interest rates are expected to rise, consider shorter FD terms so you can reinvest at a higher rate sooner.',
                    },
                    {
                      icon: '🏁',
                      label: 'Maturity',
                      sublabel: 'Auto-renew or withdraw',
                      color: '#059669',
                      examples: ['Auto-renewal default', 'Principal + interest paid', 'New rate applies'],
                      details: [
                        'At maturity, most banks automatically renew your FD at the prevailing rate unless you instruct otherwise.',
                        'Auto-renewal at a lower rate is one of the most common FD mistakes — always review before your FD matures.',
                        'Set a calendar reminder 1 week before maturity to decide: withdraw, renew at the new rate, or move to a different instrument.',
                      ],
                      tip: 'Never let an FD auto-renew without checking the new rate first. Rates at renewal may be significantly lower than your original rate.',
                    },
                  ],
                },
                {
                  type: 'callout',
                  variant: 'warning',
                  text: 'Early withdrawal penalty: most Singapore banks forfeit all interest earned if you break a fixed deposit before maturity. Some banks may also charge an administrative fee. Only place money in an FD that you are certain you won\'t need until the term ends.',
                },
                {
                  type: 'text',
                  text: 'FD rates change frequently and vary across banks. The figures below are illustrative — use the bot chip at the bottom for today\'s exact rates. Here\'s how the major banks typically compare.',
                },
                {
                  type: 'table',
                  headers: ['Bank', 'Typical Term', 'Illustrative Rate', 'Min. Deposit', 'Early Withdrawal'],
                  rows: [
                    ['DBS', '3–12 months', '~2.5–3.5% p.a.', '$1,000', 'Forfeit all interest'],
                    ['OCBC', '3–12 months', '~2.5–3.5% p.a.', '$1,000', 'Forfeit all interest'],
                    ['UOB', '3–12 months', '~2.5–3.5% p.a.', '$1,000', 'Forfeit all interest'],
                    ['GXS / Trust', '3–12 months', '~2.5–3.8% p.a.', '$500–$1,000', 'Varies by product'],
                    ['Finance companies (e.g. Sing Investments)', '1–24 months', '~3.0–4.0% p.a.', '$5,000–$10,000', 'Forfeit all interest'],
                  ],
                },
                {
                  type: 'slider',
                  icon: '🔒',
                  title: 'Fixed Deposit Interest Calculator',
                  description: 'Drag to your deposit amount to see illustrative returns across three common FD tenors at 3% p.a.',
                  min: 1000,
                  max: 50000,
                  step: 1000,
                  initialValue: 10000,
                  prefix: '$',
                  calculateResult: (amount) => [
                    { label: '3-month FD (~3% p.a.)', value: `$${(amount * 0.03 * 3/12).toFixed(2)} interest`, color: '#4F46E5' },
                    { label: '6-month FD (~3% p.a.)', value: `$${(amount * 0.03 * 6/12).toFixed(2)} interest`, color: '#0891B2' },
                    { label: '12-month FD (~3% p.a.)', value: `$${(amount * 0.03).toFixed(2)} interest`, color: '#059669' },
                  ],
                },
                {
                  type: 'text',
                  text: 'Fixed deposits, SSBs, and HYSAs can all earn similar headline rates — but they behave very differently. The right choice depends on how long you can commit, whether you need flexibility, and whether you can meet HYSA conditions.',
                },
                {
                  type: 'slider',
                  icon: '⚖️',
                  title: 'FD vs SSB vs HYSA — Annual Returns Comparison',
                  description: 'Drag to your savings amount to compare illustrative annual returns across all three instruments.',
                  min: 1000,
                  max: 50000,
                  step: 1000,
                  initialValue: 10000,
                  prefix: '$',
                  calculateResult: (amount) => [
                    { label: '🔒 Fixed Deposit (~3% p.a.)', value: `$${(amount * 0.03).toFixed(0)}/yr`, color: '#4F46E5' },
                    { label: '🇸🇬 SSB (~3% p.a. avg)', value: `$${(amount * 0.03).toFixed(0)}/yr`, color: '#059669' },
                    { label: '✅ HYSA with conditions (~3.5% p.a.)', value: `$${(amount * 0.035).toFixed(0)}/yr`, color: '#0891B2' },
                    { label: '😴 HYSA without conditions (0.05%)', value: `$${(amount * 0.0005).toFixed(0)}/yr`, color: '#9CA3AF' },
                  ],
                },
                {
                  type: 'topiccards',
                  title: 'Which instrument suits your situation?',
                  cards: [
                    {
                      icon: '🔒',
                      label: 'Fixed Deposit',
                      description: 'Best for committed lump sums',
                      color: '#4F46E5',
                      details: [
                        'Guaranteed rate locked in at placement — immune to rate cuts during the term',
                        'No conditions to meet — the rate is unconditional',
                        'Zero flexibility — early withdrawal forfeits all interest',
                      ],
                      example: 'Best for: a lump sum you are 100% certain you won\'t need for the full term — e.g. $5,000 saved from internship, parked for 6 months while you focus on studies.',
                    },
                    {
                      icon: '🇸🇬',
                      label: 'Singapore Savings Bond',
                      description: 'Best for flexible lump sums',
                      color: '#059669',
                      details: [
                        'Government-backed — zero default risk, higher guarantee than any bank deposit',
                        'Redeem any month with no penalty — full flexibility without sacrificing safety',
                        'Step-up interest rewards long-term holding but doesn\'t penalise early exit',
                      ],
                      example: 'Best for: emergency fund top-up, ang bao windfalls, or any lump sum where you want competitive rates but might need access within 12 months.',
                    },
                    {
                      icon: '🏦',
                      label: 'HYSA',
                      description: 'Best for active savers meeting conditions',
                      color: '#0891B2',
                      details: [
                        'Highest potential rates — but only when conditions (salary, spend, GIRO) are consistently met',
                        'Fully liquid — no lock-in, no redemption delay',
                        'Base rate (0.05%) is the worst of all three if conditions aren\'t met',
                      ],
                      example: 'Best for: your primary account once employed — salary credit and card spend unlock rates that beat both FDs and SSBs when conditions are consistently met.',
                    },
                  ],
                },
                {
                  type: 'text',
                  text: 'Here are three common student scenarios — which instrument makes the most sense in each?',
                },
                {
                  type: 'scenarios',
                  title: 'FD, SSB, or HYSA?',
                  scenarios: [
                    {
                      icon: '💰',
                      situation: 'You have $8,000 saved from your internship. You\'re starting full-time work in exactly 6 months and plan to use this money as a housing deposit then.',
                      options: [
                        {
                          text: 'Place it in a 6-month fixed deposit at ~3% p.a.',
                          biasLabel: 'Best fit ✓',
                          biasExplanation: 'You have a known 6-month horizon and won\'t need the money early — exactly what FDs are designed for. Guaranteed rate, no conditions, and the timing aligns perfectly with your housing plan.',
                          isIdeal: true,
                        },
                        {
                          text: 'Put it in an SSB for flexibility.',
                          biasLabel: 'Good but slightly suboptimal',
                          biasExplanation: 'An SSB is a reasonable choice given its flexibility, but SSB redemption takes up to one month to process — cutting it close for a hard 6-month deadline.',
                          isIdeal: false,
                        },
                        {
                          text: 'Leave it in your HYSA since it\'s already there.',
                          biasLabel: 'Depends on your conditions',
                          biasExplanation: 'If your HYSA is earning 3%+ with conditions met, this is acceptable. But an FD guarantees the rate unconditionally — no risk of missing a condition and dropping to 0.05% in a key month.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '🧧',
                      situation: 'You received $1,500 in Chinese New Year ang bao money. You have no immediate plans for it but might need it if an unexpected expense comes up.',
                      options: [
                        {
                          text: 'Place it in a 12-month fixed deposit for the highest rate.',
                          biasLabel: 'Too inflexible',
                          biasExplanation: 'If you might need the money for an unexpected expense, locking it in a 12-month FD is risky — early withdrawal forfeits all interest, potentially leaving you worse off than a savings account.',
                          isIdeal: false,
                        },
                        {
                          text: 'Apply for an SSB with the full $1,500.',
                          biasLabel: 'Best fit ✓',
                          biasExplanation: 'An SSB gives you a competitive rate with full flexibility — if an unexpected expense arises, you can redeem with no penalty. Perfect for windfall money with no fixed timeline.',
                          isIdeal: true,
                        },
                        {
                          text: 'Add it to your HYSA balance.',
                          biasLabel: 'Good if conditions are met',
                          biasExplanation: 'If your HYSA is actively earning bonus interest, this is a solid choice. But if your conditions aren\'t met, the SSB\'s unconditional rate beats the HYSA base rate easily.',
                          isIdeal: false,
                        },
                      ],
                    },
                    {
                      icon: '📊',
                      situation: 'You have $20,000 in savings. You\'re employed, meet all HYSA conditions, and want to optimise returns on the full amount.',
                      options: [
                        {
                          text: 'Put everything in your HYSA to maximise the bonus interest rate.',
                          biasLabel: 'Good but check the cap',
                          biasExplanation: 'Most HYSAs offer the highest rates on balances up to a certain cap — often $50,000–$75,000. At $20,000 you\'re well within that cap, so this is a strong choice if conditions are consistently met.',
                          isIdeal: false,
                        },
                        {
                          text: 'Keep $10,000 in the HYSA for daily banking and put $10,000 in an SSB.',
                          biasLabel: 'Smart diversification ✓',
                          biasExplanation: 'Splitting across instruments reduces the risk of a missed HYSA condition affecting your full savings. The SSB earns a similar rate unconditionally while the HYSA handles active salary and spend conditions.',
                          isIdeal: true,
                        },
                        {
                          text: 'Put the full $20,000 in a 12-month FD for a guaranteed rate.',
                          biasLabel: 'Too inflexible',
                          biasExplanation: 'Locking your full savings in an FD removes all liquidity. If you\'re employed and meeting HYSA conditions, your HYSA likely matches or beats the FD rate — with far more flexibility.',
                          isIdeal: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'tindertruefalse',
                  title: 'Fixed Deposits — True or False?',
                  instruction: 'Swipe right for True · Swipe left for False',
                  statements: [
                    {
                      text: 'Breaking a fixed deposit before maturity in Singapore typically results in forfeiting all interest earned.',
                      isTrue: true,
                      explanation: 'Most Singapore banks forfeit all interest — and some charge an administrative fee — if you withdraw from an FD before the term ends. Always be certain you won\'t need the money before placing.',
                    },
                    {
                      text: 'FD interest rates are variable and can change during your deposit term.',
                      isTrue: false,
                      explanation: 'FD rates are locked in at the time of placement. Rate changes after you place the deposit do not affect your return — this is one of the FD\'s key advantages over variable-rate instruments.',
                    },
                    {
                      text: 'A 6-month FD at 3% p.a. earns 3% of your deposit amount at maturity.',
                      isTrue: false,
                      explanation: 'A 3% p.a. rate on a 6-month FD earns approximately 1.5% for that period — rates are quoted per annum, so you divide by the fraction of the year the money is held.',
                    },
                    {
                      text: 'Fixed deposits in Singapore banks are protected by SDIC up to $75,000.',
                      isTrue: true,
                      explanation: 'FDs held at MAS-licensed banks are SDIC-insured up to $75,000 per depositor per bank — the same protection as savings accounts.',
                    },
                    {
                      text: 'When a fixed deposit auto-renews, it renews at the same interest rate as the original deposit.',
                      isTrue: false,
                      explanation: 'Auto-renewal applies the prevailing rate at the time of renewal — which may be significantly lower or higher than your original rate. Always review before maturity and instruct the bank accordingly.',
                    },
                  ],
                },
                {
                  type: 'bot',
                  label: '💬 Current fixed deposit rates across Singapore banks',
                  prompt: 'Current fixed deposit interest rates DBS OCBC UOB Singapore 2025 comparison best rates',
                },
              ],
              flashcards: [
                { q: 'What is the main trade-off of a fixed deposit?', a: 'Higher guaranteed interest rate, but your money is locked for the full term — early withdrawal typically forfeits all interest earned.' },
                { q: 'How is FD interest calculated for a term shorter than 12 months?', a: 'FD rates are quoted per annum — divide by the fraction of the year. A 3% p.a. rate on a 6-month FD earns approximately 1.5% for that period.' },
                { q: 'What happens when a fixed deposit auto-renews?', a: 'It renews at the prevailing rate on the renewal date — which may be lower or higher than your original rate. Always review before maturity.' },
                { q: 'When is a fixed deposit a better choice than an SSB?', a: 'When you have a known fixed horizon and are 100% certain you won\'t need the money early — FDs offer an unconditional guaranteed rate with no redemption delay.' },
                { q: 'Are fixed deposits in Singapore banks protected by SDIC?', a: 'Yes — FDs at MAS-licensed banks are SDIC-insured up to $75,000 per depositor per bank, the same as savings accounts.' },
              ],
            },
            {
              id: '6-3', title: 'T-Bills & Low-Risk Instruments', icon: '📑',
              topic: 'Singapore T-bills treasury bills how to buy',
              duration: '5 min', xp: 80,
              sections: [{ key: 'what', heading: 'What Are T-Bills?' }, { key: 'apply', heading: 'Applying via CPF/Cash' }, { key: 'vs',heading: 'T-Bills vs SSB vs FD' }], 
              content: [
              {
                type: 'text',
                text: 'T-bills are the shortest-term government securities available in Singapore — 6 months or 1 year. Unlike SSBs which pay step-up interest over time, T-bills work differently: you buy them at a discount to their face value and receive the full face value at maturity. The difference between what you pay and what you receive is your return. No monthly interest, no coupons — just buy low, redeem high.',
              },
              {
                type: 'keyterm',
                term: 'Treasury Bill (T-Bill)',
                definition: 'A short-term Singapore government security with a 6-month or 1-year tenor, sold at a discount to its face value of $1 via a competitive auction. Your return is the difference between the discounted purchase price and the $1 face value received at maturity.',
              },
              {
                type: 'callout',
                variant: 'fact',
                text: 'T-bills are issued by MAS and backed by the Singapore government — the same zero default risk as SSBs. The key difference is tenor and mechanic: T-bills are shorter (6 months or 1 year) and sold via auction rather than at a fixed rate.',
              },
              {
                type: 'text',
                text: 'T-bills have three mechanics that make them different from every other savings instrument covered so far — the auction, the discount pricing, and the maturity payout.',
              },
              {
                type: 'timeline',
                title: 'How T-bills work:',
                nodes: [
                  {
                    icon: '🏛️',
                    label: 'The Auction',
                    sublabel: 'Competitive vs non-competitive',
                    color: '#4F46E5',
                    examples: ['Held every 2–4 weeks', 'Non-competitive bid recommended', 'Cut-off yield determined by market'],
                    details: [
                      'T-bills are sold via auction — buyers submit bids indicating the yield they are willing to accept.',
                      'Competitive bids specify a yield — if your bid yield is higher than the cut-off, you are shut out.',
                      'Non-competitive bids accept whatever cut-off yield the auction determines — you are guaranteed allotment at the market rate.',
                    ],
                    tip: 'Always submit a non-competitive bid. Competitive bids risk being shut out entirely if the market clears at a lower yield than you specified.',
                  },
                  {
                    icon: '💹',
                    label: 'Discount Pricing',
                    sublabel: 'Buy below face value',
                    color: '#0891B2',
                    examples: ['Face value: $1 per unit', 'Min. application: $1,000', 'You pay less than $1,000'],
                    details: [
                      'T-bills have a face value of $1 per unit. You apply for a minimum of $1,000 face value.',
                      'The actual amount you pay is less than $1,000 — the discount reflects the yield.',
                      'Example: a 6-month T-bill at 3.5% p.a. means you pay approximately $982.50 for $1,000 face value — earning $17.50 over 6 months.',
                    ],
                    tip: 'Your bank account is debited the discounted amount — not the full $1,000. The difference is your return, credited at maturity.',
                  },
                  {
                    icon: '🏁',
                    label: 'Maturity',
                    sublabel: 'Receive full face value',
                    color: '#059669',
                    examples: ['Receive exactly $1 per unit', 'Credited to bank account', 'No reinvestment by default'],
                    details: [
                      'At maturity — 6 months or 1 year after issuance — you receive the full face value of $1 per unit.',
                      'The maturity proceeds are credited directly to your linked bank account.',
                      'Unlike FDs, T-bills do not auto-renew — you must apply for a new T-bill if you want to reinvest.',
                    ],
                    tip: 'Set a calendar reminder before your T-bill matures — if you want to reinvest, you need to actively apply for the next auction.',
                  },
                ],
              },
              {
                type: 'table',
                headers: ['Feature', 'Details'],
                rows: [
                  ['Issued by', 'Monetary Authority of Singapore (MAS)'],
                  ['Tenor', '6 months or 1 year'],
                  ['Minimum investment', '$1,000 (in multiples of $1,000)'],
                  ['Maximum investment', 'No individual limit'],
                  ['How return is paid', 'Discount at purchase — full face value at maturity'],
                  ['Auction frequency', 'Every 2–4 weeks (6-month), monthly (1-year)'],
                  ['CPF-OA eligible', 'Yes — can use CPF Ordinary Account funds'],
                  ['SRS eligible', 'Yes — can use Supplementary Retirement Scheme funds'],
                  ['Default risk', 'Zero — Singapore government backed'],
                  ['Early redemption', 'Not redeemable before maturity (can sell on secondary market)'],
                ],
              },
              {
                type: 'text',
                text: 'One of T-bills\' most distinctive features is that they can be purchased using CPF Ordinary Account (OA) funds — making them one of the few short-term instruments where your CPF savings can earn a competitive market rate.',
              },
              {
                type: 'steps',
                title: 'How to apply for a T-bill:',
                steps: [
                  'Ensure you have a CDP account linked to your bank account (DBS, OCBC, or UOB). The same CDP account used for SSBs works for T-bills.',
                  'Check the upcoming T-bill auction schedule on the MAS website — note the application opening and closing dates.',
                  'Log into your bank\'s internet banking. Navigate to "Investments" or "Singapore Government Securities" and select T-bill application.',
                  'Enter your application amount (minimum $1,000, multiples of $1,000) and select "Non-Competitive Bid" to guarantee allotment at the cut-off yield.',
                  'If using CPF-OA funds, select CPF as the funding source — your CPF-OA will be debited the discounted amount instead of your bank account.',
                  'Wait for allotment results — announced 1–2 business days after the auction closes. Your account is debited the discounted purchase price.',
                  'At maturity, the full face value ($1,000 per unit) is credited to your linked bank account or CPF-OA automatically.',
                ],
              },
              {
                type: 'callout',
                variant: 'tip',
                text: 'Always submit a non-competitive bid. Competitive bids specify a yield — if the auction clears at a lower yield than you specified, your bid is rejected and you receive nothing. Non-competitive bids guarantee allotment at whatever yield the market determines.',
              },
              {
                type: 'flipcards',
                title: 'Common T-bill misconceptions → the reality:',
                cards: [
                  {
                    frontLabel: '❌ Misconception',
                    backLabel: '✅ Reality',
                    front: '"I need to know the right yield to bid — T-bills are too complicated for a beginner."',
                    back: 'Submit a non-competitive bid and you automatically receive the cut-off yield determined by the auction. You don\'t need to know anything about yields to participate — just enter your amount and select non-competitive.',
                    tag: 'Non-competitive bids remove all complexity',
                  },
                  {
                    frontLabel: '❌ Misconception',
                    backLabel: '✅ Reality',
                    front: '"T-bills charge interest like a loan — I\'m paying a discount, which means I\'m losing money upfront."',
                    back: 'The discount is your return, not a fee. You pay $982.50 for $1,000 face value — at maturity you receive $1,000. The $17.50 difference is your interest earned. You are always better off at maturity than at purchase.',
                    tag: 'Discount = your return, not a cost',
                  },
                  {
                    frontLabel: '❌ Misconception',
                    backLabel: '✅ Reality',
                    front: '"I can redeem my T-bill early if I need the money — just like an SSB."',
                    back: 'T-bills cannot be redeemed early through MAS. If you need the money before maturity, you would need to sell on the secondary market — which may be at a discount and involves transaction fees. Only invest money you won\'t need.',
                    tag: 'T-bills are not redeemable early',
                  },
                  {
                    frontLabel: '❌ Misconception',
                    backLabel: '✅ Reality',
                    front: '"Using CPF-OA for T-bills means my CPF money is locked away and I lose the 2.5% OA interest."',
                    back: 'You give up the CPF-OA\'s 2.5% p.a. guaranteed rate while the funds are in the T-bill. This only makes sense when T-bill yields exceed 2.5% p.a. — always compare the T-bill cut-off yield against 2.5% before using CPF funds.',
                    tag: 'Only use CPF if T-bill yield > 2.5% p.a.',
                  },
                ],
              },
              {
                type: 'text',
                text: 'T-bills, SSBs, and fixed deposits are all low-risk instruments — but they suit different situations. Here\'s how they compare across the dimensions that matter most.',
              },
              {
                type: 'table',
                headers: ['Feature', 'T-Bill', 'SSB', 'Fixed Deposit'],
                rows: [
                  ['Tenor', '6 months or 1 year', 'Up to 10 years', '1–36 months'],
                  ['Minimum investment', '$1,000', '$500', '$1,000'],
                  ['How return is paid', 'Discount at purchase', 'Every 6 months to bank', 'At maturity'],
                  ['Early exit', 'Secondary market only', 'Redeem any month, no penalty', 'Forfeit all interest'],
                  ['CPF-OA eligible', 'Yes', 'No', 'No'],
                  ['SRS eligible', 'Yes', 'Yes', 'Yes'],
                  ['Rate determined by', 'Market auction', 'MAS (fixed monthly)', 'Bank (fixed at placement)'],
                  ['Default risk', 'Zero', 'Zero', 'Low (SDIC up to $75k)'],
                  ['Auto-renewal', 'No — manual reapplication', 'No', 'Yes — at prevailing rate'],
                ],
              },
              {
                type: 'scenarios',
                title: 'T-Bill, SSB, or Fixed Deposit?',
                scenarios: [
                  {
                    icon: '💼',
                    situation: 'You have $10,000 in your CPF Ordinary Account earning 2.5% p.a. The latest 6-month T-bill cut-off yield is 3.8% p.a. You won\'t need these CPF funds for at least 6 months.',
                    options: [
                      {
                        text: 'Leave the CPF-OA funds earning 2.5% p.a. — it\'s guaranteed and hassle-free.',
                        biasLabel: 'Leaving money behind',
                        biasExplanation: 'At 3.8% vs 2.5%, the T-bill earns an additional 1.3% p.a. — on $10,000 for 6 months, that\'s an extra $65. When T-bill yields meaningfully exceed 2.5%, using CPF-OA funds is worth the effort.',
                        isIdeal: false,
                      },
                      {
                        text: 'Apply for the 6-month T-bill using CPF-OA funds via internet banking.',
                        biasLabel: 'Best use of CPF-OA ✓',
                        biasExplanation: 'When T-bill yields exceed the CPF-OA rate of 2.5%, applying with CPF funds earns a better return on money that would otherwise sit idle. The process is straightforward via your bank\'s internet banking.',
                        isIdeal: true,
                      },
                      {
                        text: 'Put the $10,000 in an SSB instead — same government backing, more flexibility.',
                        biasLabel: 'SSBs can\'t use CPF funds',
                        biasExplanation: 'SSBs are not eligible for CPF-OA investment — you can only apply with cash or SRS funds. To deploy CPF-OA savings at a higher rate, T-bills are the primary option.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '🎓',
                    situation: 'You have $3,000 in cash savings. You\'re graduating in 7 months and plan to use this money for initial work expenses. You want the best return with minimal risk.',
                    options: [
                      {
                        text: 'Apply for a 6-month T-bill — government-backed and matures before graduation.',
                        biasLabel: 'Strong choice ✓',
                        biasExplanation: 'A 6-month T-bill aligns with your 7-month horizon, carries zero default risk, and typically offers competitive yields. Just ensure the maturity date is before you need the funds.',
                        isIdeal: true,
                      },
                      {
                        text: 'Put it in an SSB for flexibility in case plans change.',
                        biasLabel: 'Also reasonable',
                        biasExplanation: 'An SSB is a solid alternative — especially if your timeline might shift. The trade-off is that SSB redemption takes up to one month, so plan accordingly if your graduation date is fixed.',
                        isIdeal: false,
                      },
                      {
                        text: 'Place it in a 6-month fixed deposit at the same rate.',
                        biasLabel: 'Similar outcome, less flexible',
                        biasExplanation: 'An FD at the same rate as a T-bill is functionally equivalent — but T-bills are government-backed while FDs rely on SDIC insurance. For the same rate, T-bills carry marginally lower risk.',
                        isIdeal: false,
                      },
                    ],
                  },
                  {
                    icon: '🔄',
                    situation: 'You\'ve been rolling T-bills every 6 months for a year. The latest auction cut-off yield has dropped to 2.3% p.a. — below your HYSA\'s effective rate of 3.2%.',
                    options: [
                      {
                        text: 'Continue rolling T-bills — consistency is important.',
                        biasLabel: 'Loyalty over returns',
                        biasExplanation: 'Rolling T-bills when yields fall below your HYSA rate means accepting a lower return for no additional benefit. There\'s no loyalty reward — always compare current yields before each application.',
                        isIdeal: false,
                      },
                      {
                        text: 'Skip this T-bill cycle and leave the funds in your HYSA instead.',
                        biasLabel: 'Best move ✓',
                        biasExplanation: 'When T-bill yields fall below your HYSA effective rate, your HYSA is the better instrument — with full liquidity on top. Review each T-bill cycle independently rather than rolling automatically.',
                        isIdeal: true,
                      },
                      {
                        text: 'Switch to an SSB for a longer-term rate lock.',
                        biasLabel: 'Reasonable if rates are falling',
                        biasExplanation: 'If you expect yields to continue falling, locking into an SSB\'s step-up structure could make sense. But if your HYSA is already outperforming, that\'s the simpler choice for now.',
                        isIdeal: false,
                      },
                    ],
                  },
                ],
              },
              {
                type: 'tindertruefalse',
                title: 'T-Bills — True or False?',
                instruction: 'Swipe right for True · Swipe left for False',
                statements: [
                  {
                    text: 'A non-competitive T-bill bid guarantees you will receive allotment at the auction\'s cut-off yield.',
                    isTrue: true,
                    explanation: 'Non-competitive bids accept whatever yield the auction determines — you are guaranteed allotment. Competitive bids specify a yield and risk being shut out if the auction clears lower.',
                  },
                  {
                    text: 'T-bills pay interest every 6 months like SSBs.',
                    isTrue: false,
                    explanation: 'T-bills do not pay periodic interest. They are sold at a discount to face value — your return is the difference between what you pay and the $1 face value you receive at maturity.',
                  },
                  {
                    text: 'You can use CPF Ordinary Account funds to apply for Singapore T-bills.',
                    isTrue: true,
                    explanation: 'T-bills are CPF-OA eligible — one of the few short-term instruments that allows CPF funds to be deployed at market rates. This only makes sense when T-bill yields exceed the CPF-OA\'s 2.5% p.a. guaranteed rate.',
                  },
                  {
                    text: 'T-bills can be redeemed early through MAS with no penalty, similar to SSBs.',
                    isTrue: false,
                    explanation: 'T-bills cannot be redeemed early through MAS. If you need funds before maturity, you would need to sell on the secondary market — which may be at a discount and involves transaction costs.',
                  },
                  {
                    text: 'Using CPF-OA funds for T-bills always makes financial sense regardless of the cut-off yield.',
                    isTrue: false,
                    explanation: 'CPF-OA funds earn a guaranteed 2.5% p.a. Using them for T-bills only makes sense when the T-bill cut-off yield exceeds 2.5%. If yields are below this, you are better off leaving funds in CPF-OA.',
                  },
                ],
              },
              {
                type: 'bot',
                label: '💬 Current T-bill cut-off yields and upcoming auction dates',
                prompt: 'Singapore T-bill latest cut-off yield 6-month 1-year upcoming auction dates MAS 2025',
              },
            ],
            flashcards: [
              { q: 'What is a T-bill and how does it generate a return?', a: 'A short-term Singapore government security sold at a discount to face value. You pay less than $1,000 and receive $1,000 at maturity — the difference is your return.' },
              { q: 'What is the difference between a competitive and non-competitive T-bill bid?', a: 'A competitive bid specifies a yield and risks being shut out. A non-competitive bid accepts whatever cut-off yield the auction determines and guarantees allotment — always choose non-competitive.' },
              { q: 'Can you use CPF Ordinary Account funds to buy T-bills?', a: 'Yes — T-bills are CPF-OA eligible. It only makes sense when the T-bill cut-off yield exceeds the CPF-OA\'s guaranteed rate of 2.5% p.a.' },
              { q: 'Can T-bills be redeemed early like SSBs?', a: 'No — T-bills cannot be redeemed early through MAS. Early exit requires selling on the secondary market, which may be at a discount and involves transaction costs.' },
              { q: 'When should you choose a T-bill over an SSB?', a: 'When you want a shorter fixed horizon (6 months or 1 year), want to deploy CPF-OA funds, or when T-bill auction yields are more attractive than the current SSB rate.' },
            ],
            },
          ],
        },
      ],
    },
  // ═══════════════════════════════════════════
  // MODULE 3 — Investing
  // ═══════════════════════════════════════════
  {
    id: 'module-3',
    title: 'Investing',
    description: 'Make your money work for you through smart, long-term investing',
    icon: '📈',
    color: '#059669',
    colorLight: '#ECFDF5',
    chapters: [
      {
        id: 'chapter-7',
        title: 'Investing Fundamentals',
        icon: '🌱',
        description: 'Core concepts every investor must understand first',
        lessons: [
          { id: '7-1', title: 'Why Invest at All?', icon: '🤔', topic: 'Why investing beats saving alone', duration: '5 min', xp: 80, sections: [{ key: 'why', heading: 'Inflation Erodes Savings' }, { key: 'power', heading: 'The Power of Compounding' }, { key: 'start', heading: 'Starting Early' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'Why does money in a savings account lose value over time?', a: 'Inflation erodes purchasing power — if inflation is 3% and your account earns 0.05%, you\'re losing 2.95%/year in real terms.' }] },
          { id: '7-2', title: 'Risk & Return', icon: '⚖️', topic: 'Risk return tradeoff investing', duration: '6 min', xp: 80, sections: [{ key: 'tradeoff', heading: 'The Risk-Return Tradeoff' }, { key: 'types', heading: 'Types of Investment Risk' }, { key: 'tolerance', heading: 'Your Risk Tolerance' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the risk-return tradeoff?', a: 'Higher potential returns always come with higher risk — there is no high-return, zero-risk investment.'}] },
          { id: '7-3', title: 'Diversification', icon: '🎨', topic: 'Diversification portfolio investing strategy', duration: '5 min', xp: 80, sections: [{ key: 'what', heading: 'What is Diversification?' }, { key: 'how', heading: 'How to Diversify' }, { key: 'etf', heading: 'ETFs as Instant Diversification' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the simplest way to achieve diversification?', a: 'Buy a broad market ETF (e.g. S&P 500 ETF) — one purchase gives you exposure to 500 companies.' }] },
        ],
      },
      {
        id: 'chapter-8',
        title: 'Investing in Singapore',
        icon: '🇸🇬',
        description: 'Practical investing options available to you right now',
        lessons: [
          { id: '8-1', title: 'Opening a CDP & Brokerage Account', icon: '🏦', topic: 'CDP account brokerage Singapore how to open invest', duration: '7 min', xp: 90, sections: [{ key: 'cdp', heading: 'What is a CDP Account?' }, { key: 'brokers', heading: 'Singapore Brokerages Compared' }, { key: 'open', heading: 'Opening Your Account' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is a CDP account?', a: 'Central Depository account — holds your Singapore-listed shares. Required to buy SGX-listed stocks.' }] },
          { id: '8-2', title: 'STI ETF & Singapore Stocks', icon: '📊', topic: 'STI ETF Singapore Exchange stocks investing', duration: '6 min', xp: 90, sections: [{ key: 'sti', heading: 'What is the STI ETF?' }, { key: 'reits', heading: 'Singapore REITs' }, { key: 'blue', heading: 'Blue Chip Singapore Stocks' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What does the STI ETF track?', a: 'The Straits Times Index — Singapore\'s top 30 listed companies by market cap.' }] },
          { id: '8-3', title: 'Robo-Advisors in Singapore', icon: '🤖', topic: 'Syfe StashAway Endowus robo advisor Singapore', duration: '6 min', xp: 90, sections: [{ key: 'what', heading: 'What is a Robo-Advisor?' }, { key: 'options', heading: 'Syfe vs StashAway vs Endowus' }, { key: 'start', heading: 'Getting Started with $100' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the minimum investment for most Singapore robo-advisors?', a: 'As low as $1–$100 — Syfe and StashAway both allow very low minimums.' }] },
        ],
      },
      {
        id: 'chapter-9',
        title: 'Robo-Advisors & DCA',
        icon: '🔄',
        description: 'Automate investing and remove emotion from the equation',
        lessons: [
          { id: '9-1', title: 'Dollar-Cost Averaging', icon: '📅', topic: 'Dollar cost averaging DCA investing strategy', duration: '5 min', xp: 90, sections: [{ key: 'what', heading: 'What is DCA?' }, { key: 'why', heading: 'Why DCA Beats Timing the Market' }, { key: 'setup', heading: 'Setting Up Automatic DCA' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is dollar-cost averaging?', a: 'Investing a fixed amount at regular intervals — regardless of market price. Reduces impact of volatility.' }] },
          { id: '9-2', title: 'Investing with CPFIS', icon: '🏛️', topic: 'CPF Investment Scheme CPFIS OA SA invest', duration: '6 min', xp: 90, sections: [{ key: 'what', heading: 'What is CPFIS?' }, { key: 'eligible', heading: 'What You Can Invest In' }, { key: 'vs', heading: 'CPFIS vs Cash Investing' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the minimum OA balance before you can use CPFIS?', a: '$20,000 must remain in your OA before you can invest the rest via CPFIS.' }] },
          { id: '9-3', title: 'Avoiding Common Investing Mistakes', icon: '⚠️', topic: 'Common investing mistakes beginners Singapore', duration: '5 min', xp: 90, sections: [{ key: 'mistakes', heading: 'The 5 Biggest Beginner Mistakes' }, { key: 'crypto', heading: 'A Note on Crypto & Meme Stocks' }, { key: 'mindset', heading: 'Long-Term Investor Mindset' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the biggest mistake new investors make?', a: 'Timing the market — trying to buy low and sell high. Time IN the market consistently outperforms timing.' }] },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════
  // MODULE 4 — CPF & Advanced Topics
  // ═══════════════════════════════════════════════
  {
    id: 'module-4',
    title: 'CPF & Advanced Topics',
    description: 'Master Singapore\'s unique financial systems before you enter the workforce',
    icon: '🏛️',
    color: '#DC2626',
    colorLight: '#FEF2F2',
    chapters: [
      {
        id: 'chapter-10',
        title: 'CPF Fundamentals',
        icon: '🏦',
        description: 'Understand Singapore\'s Central Provident Fund inside out',
        lessons: [
          { id: '10-1', title: 'What is CPF?', icon: '❓', topic: 'CPF Central Provident Fund basics Singapore', duration: '7 min', xp: 100, sections: [{ key: 'what', heading: 'What CPF Is and Why It Exists' }, { key: 'accounts', heading: 'The Four CPF Accounts' }, { key: 'international', heading: 'CPF for International Graduates' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What are the four CPF accounts?', a: 'Ordinary Account (OA), Special Account (SA), MediSave Account (MA), and Retirement Account (RA — created at 55).' }] },
          { id: '10-2', title: 'CPF Contribution Rates', icon: '💹', topic: 'CPF contribution rates employee employer Singapore', duration: '6 min', xp: 100, sections: [{ key: 'rates', heading: 'Employee & Employer Rates' }, { key: 'calc', heading: 'Calculating Your Contribution' }, { key: 'changes', heading: 'Rate Changes Over Your Career' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the total CPF contribution rate for employees under 55?', a: '37% of gross salary — 20% from employee, 17% from employer.' }] },
          { id: '10-3', title: 'CPF OA: Housing & Investments', icon: '🏠', topic: 'CPF Ordinary Account housing investment CPFIS', duration: '6 min', xp: 100, sections: [{ key: 'oa', heading: 'What Your OA Can Be Used For' }, { key: 'housing', heading: 'Using OA for HDB' }, { key: 'invest', heading: 'Investing Your OA' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What interest rate does the CPF OA earn?', a: '2.5% per annum — guaranteed by the Singapore government.' }] },
        ],
      },
      {
        id: 'chapter-11',
        title: 'Tax & Insurance',
        icon: '📋',
        description: 'Navigate Singapore\'s tax system and protect what you build',
        lessons: [
          { id: '11-1', title: 'Singapore Income Tax Basics', icon: '🧾', topic: 'Singapore income tax personal relief filing', duration: '7 min', xp: 100, sections: [{ key: 'how', heading: 'How Singapore Tax Works' }, { key: 'rates', heading: 'Tax Rates & Brackets' }, { key: 'relief', heading: 'Key Tax Reliefs to Claim' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the first tax bracket in Singapore?', a: 'The first $20,000 of chargeable income is taxed at 0% — Singapore has very low income tax.' }] },
          { id: '11-2', title: 'MediShield Life & Insurance', icon: '🏥', topic: 'MediShield Life insurance Singapore basics', duration: '6 min', xp: 100, sections: [{ key: 'medishield', heading: 'What MediShield Life Covers' }, { key: 'gap', heading: 'The Insurance Gap' }, { key: 'need', heading: 'What Insurance Do You Actually Need?' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What does MediShield Life cover?', a: 'Large hospital bills and selected outpatient treatments — all Singapore citizens and PRs are enrolled automatically.' }] },
          { id: '11-3', title: 'Tax Relief Through CPF Top-Ups', icon: '💡', topic: 'CPF top up tax relief SA Retirement Account Singapore', duration: '5 min', xp: 100, sections: [{ key: 'topup', heading: 'CPF Cash Top-Up Scheme' }, { key: 'relief', heading: 'Tax Relief Amounts' }, { key: 'strategy', heading: 'Optimising Your Top-Up Strategy' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'How much tax relief can you get from CPF cash top-ups?', a: 'Up to $8,000 for self top-up + $8,000 for family members = $16,000 total relief per year.' }] },
        ],
      },
      {
        id: 'chapter-12',
        title: 'Long-Term Financial Planning',
        icon: '🔭',
        description: 'Build a financial plan that spans decades, not months',
        lessons: [
          { id: '12-1', title: 'Planning for Your First Job', icon: '💼', topic: 'Financial planning first job Singapore graduate salary', duration: '7 min', xp: 110, sections: [{ key: 'salary', heading: 'Understanding Your Offer Letter' }, { key: 'first', heading: 'First Month Financial Checklist' }, { key: 'setup', heading: 'Setting Up Your Financial System' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the median graduate starting salary in Singapore?', a: 'Around $3,500–$4,200/month for fresh graduates, varying by industry and university.' }] },
          { id: '12-2', title: 'Net Worth Tracking', icon: '📊', topic: 'Net worth calculation tracking personal finance Singapore', duration: '5 min', xp: 110, sections: [{ key: 'what', heading: 'What is Net Worth?' }, { key: 'calc', heading: 'Calculating Yours' }, { key: 'grow', heading: 'Growing Net Worth Over Time' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'How do you calculate net worth?', a: 'Total Assets (savings + investments + CPF + property) minus Total Liabilities (loans + credit card debt).' }] },
          { id: '12-3', title: 'Retirement Planning in Singapore', icon: '🌅', topic: 'CPF retirement planning Singapore BRS FRS ERS', duration: '7 min', xp: 110, sections: [{ key: 'cpflife', heading: 'CPF LIFE — Your Retirement Income' }, { key: 'targets', heading: 'BRS, FRS & ERS Explained' }, { key: 'plan', heading: 'Building Your Retirement Plan' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is CPF LIFE?', a: 'A lifelong monthly payout scheme funded by your CPF Retirement Account — Singapore\'s version of an annuity.' }] },
        ],
      },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────
export const getAllLessons = () =>
  MODULES.flatMap(m => m.chapters.flatMap(c => c.lessons));

export const getLessonById = (id) =>
  getAllLessons().find(l => l.id === id);

export const getChapterByLessonId = (id) =>
  MODULES.flatMap(m => m.chapters).find(c => c.lessons.some(l => l.id === id));

export const getModuleByLessonId = (id) =>
  MODULES.find(m => m.chapters.some(c => c.lessons.some(l => l.id === id)));

// Backwards compatibility
export const LESSONS = getAllLessons();