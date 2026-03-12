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
            fincoins: 45,
            sections: [
                // ─── Section 1: What is Financial Literacy? ──────────
                {
                key: 'definition',
                title: 'What is Financial Literacy?',
                fincoins: 10,
                minFincoins: 10,
                content: [
                    {
                    type: 'heading',
                    text: 'What is Financial Literacy?',
                    },
                    {
                    type: 'text',
                    text: 'Financial literacy is more than knowing financial vocabulary. It encompasses three things: the knowledge to understand financial concepts such as compound interest and inflation, the skill to apply that knowledge in real decisions, and the confidence to act on it. All three are required — knowledge without skill or confidence rarely translates into better financial outcomes.',
                    },
                    {
                    type: 'keyterm',
                    term: 'Financial Literacy',
                    definition: 'The knowledge, skill, and confidence to make informed financial decisions — covering budgeting, saving, investing, and managing debt. It is the difference between knowing what compound interest is and actually using it to make better choices.',
                    },
                    {
                    type: 'bot',
                    label: '💬 Current financial literacy rates in Singapore',
                    prompt: 'Singapore financial literacy rate 2024 2025 survey statistics percentage MAS MoneySense',
                    },
                    {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Only 59% of Singaporeans are considered financially literate — and among university students, the rate is lower still despite higher education levels. Financial literacy is not a byproduct of academic achievement.',
                    },
                    {
                    type: 'heading',
                    text: 'Misconceptions about Financial Literacy',
                    },
                    {
                    type: 'flipcards',
                    exerciseId: '1-1-s1-flip',
                    fincoins: 10,
                    title: 'What FL actually means — and what it doesn\'t',
                    cards: [
                        {
                        frontLabel: '❌ Common misconception',
                        backLabel: '✅ Reality',
                        front: 'Financial literacy just means knowing financial terms and definitions.',
                        back: 'Knowing definitions is financial knowledge — not financial literacy. Literacy requires the skill and confidence to apply that knowledge in real decisions. Someone can define "compound interest" and still keep all their money in a 0.05% savings account.',
                        tag: 'Knowledge ≠ Literacy',
                        },
                        {
                        frontLabel: '❌ Common misconception',
                        backLabel: '✅ Reality',
                        front: 'High earners are automatically financially literate.',
                        back: 'Income and financial literacy are not the same thing. High earners with low literacy often accumulate lifestyle debt, fail to invest, and have little savings despite large salaries. Literacy is about behaviour, not income.',
                        tag: 'Income ≠ Literacy',
                        },
                        {
                        frontLabel: '❌ Common misconception',
                        backLabel: '✅ Reality',
                        front: 'Financial literacy is only relevant once you start earning a full-time salary.',
                        back: 'Financial habits formed during university — budgeting, saving, and avoiding debt — are among the most persistent across a lifetime. The earlier literacy is developed, the longer it has to compound into better outcomes.',
                        tag: 'Start early',
                        },
                        {
                        frontLabel: '❌ Common misconception',
                        backLabel: '✅ Reality',
                        front: 'Studying a finance or business degree makes someone financially literate.',
                        back: 'Academic finance covers theory and markets — not personal financial decision-making. Studies consistently show finance graduates are not significantly more financially literate than peers in other disciplines when it comes to personal money management.',
                        tag: 'Degree ≠ Literacy',
                        },
                    ],
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '1-1-s1-tinder',
                      fincoins: 10,
                      title: 'Financial Literacy — True or False?',
                      instruction: 'Swipe right for True · Swipe left for False',
                      statements: [
                        {
                          text: 'Financial literacy means the same thing as financial knowledge.',
                          isTrue: false,
                          explanation: 'Financial literacy requires three things — knowledge, skill, and confidence. Knowledge alone is not literacy. Someone can understand compound interest in theory and still make poor financial decisions in practice.',
                        },
                        {
                          text: 'A person can be financially literate without earning a high income.',
                          isTrue: true,
                          explanation: 'Financial literacy is about behaviour and decision-making, not income level. A low earner who budgets, saves, and avoids debt is more financially literate than a high earner who accumulates lifestyle debt and saves nothing.',
                        },
                        {
                          text: 'Studying a finance or business degree guarantees strong personal financial literacy.',
                          isTrue: false,
                          explanation: 'Academic finance covers markets and theory — not personal money management. Studies show finance graduates are not significantly more financially literate than peers in other disciplines when it comes to personal financial decisions.',
                        },
                        {
                          text: 'Financial habits formed during university are among the most persistent across a lifetime.',
                          isTrue: true,
                          explanation: 'University is often the first time students make independent financial decisions. Habits formed during this period — budgeting, saving, avoiding debt — tend to persist long after graduation.',
                        },
                        {
                          text: 'High earners are automatically more financially literate than low earners.',
                          isTrue: false,
                          explanation: 'Income and financial literacy are unrelated. High earners with low literacy frequently accumulate lifestyle debt, fail to invest, and have little savings despite large salaries. Literacy is about behaviour, not income.',
                        },
                      ],
                    },
                ],
                },

                // ─── Section 2: Why Financial Literacy Matters ────────
                {
                key: 'why',
                title: 'Why Financial Literacy Matters',
                fincoins: 10,
                minFincoins: 10,
                content: [
                    {
                    type: 'heading',
                    text: 'Why Financial Literacy Matters',
                    },
                    {
                    type: 'text',
                    text: 'The consequences of low financial literacy are concrete and measurable. Research consistently links poor financial literacy to higher debt levels, lower savings rates, and greater vulnerability to financial shocks. In Singapore — where the cost of living is high, financial products are increasingly complex, and retirement planning is largely self-directed — the stakes are particularly significant.',
                    },
                                        {
                    type: 'subheading',
                    text: 'Three Main Impact Areas',
                    },
                    {
                    type: 'topiccards',
                    cards: [
                        {
                        icon: '💰',
                        label: 'Budgeting & Saving',
                        description: 'Financially literate individuals are significantly more likely to build savings and emergency funds.',
                        color: '#4F46E5',
                        details: [
                            'People with higher financial literacy are more likely to have 3–6 months of expenses saved as an emergency fund.',
                            'They are better at tracking spending and identifying where money is being lost to unnecessary costs.',
                            'In Singapore, where monthly expenses are high, a failure to budget consistently is one of the leading causes of financial stress among students and young adults.',
                            'Financial literacy enables the distinction between needs and wants — the foundation of any effective budget.',
                        ],
                        example: 'A financially literate student on a $1,500/month allowance builds a $3,000 emergency fund within a year by consistently allocating 20% to savings. A peer with the same income and no literacy framework spends everything and has nothing saved after graduation.',
                        },
                        {
                        icon: '💳',
                        label: 'Debt Management',
                        description: 'Low financial literacy is one of the strongest predictors of problematic debt accumulation.',
                        color: '#DC2626',
                        details: [
                            'Individuals with low financial literacy are more likely to carry high-interest credit card balances without understanding the true cost.',
                            'They are more vulnerable to predatory lending — buy-now-pay-later schemes, personal loans with high effective interest rates, and credit rollovers.',
                            'Understanding the difference between good debt (e.g. a low-interest student loan for a valuable qualification) and bad debt (e.g. credit card debt at 25% p.a.) is a core literacy skill.',
                            'In Singapore, personal insolvency cases are disproportionately linked to credit card and unsecured debt — products that are heavily marketed to young adults.',
                        ],
                        example: 'An international student uses a credit card for daily expenses and pays only the minimum each month. At 25% p.a. effective interest, a $2,000 balance takes over 3 years to clear and costs nearly $800 in interest — a cost that financial literacy would have prevented.',
                        },
                        {
                        icon: '📈',
                        label: 'Investing & Wealth',
                        description: 'Financial literacy is the strongest individual predictor of long-term wealth accumulation.',
                        color: '#059669',
                        details: [
                            'Financially literate individuals are significantly more likely to participate in stock markets and retirement savings schemes.',
                            'They start investing earlier — and because of compounding, earlier investing has a disproportionate impact on final wealth.',
                            'They are better at evaluating financial products — avoiding high-fee unit trusts, unnecessary insurance-investment hybrids, and scam investments.',
                            'In Singapore, understanding CPF, SRS, and tax-advantaged accounts is directly linked to long-term retirement readiness.',
                        ],
                        example: 'Two graduates start work at the same salary. One invests $300/month from age 23; the other waits until 33. By age 65, the early investor has nearly twice the retirement wealth — the difference is entirely due to 10 extra years of compounding.',
                        },
                    ],
                    },
                    {
                    type: 'bot',
                    label: '💬 Research on financial literacy and financial behaviour outcomes',
                    prompt: 'Financial literacy impact financial behaviour outcomes research evidence saving investing debt management 2024',
                    },
                    {
                    type: 'subheading',
                    text: 'Put it into Practice',
                    },
                    {
                    type: 'scenarios',
                    exerciseId: '1-1-s2-scenarios',
                    fincoins: 10,
                    title: 'Financial literacy in action — what would a financially literate person do?',
                    scenarios: [
                        {
                        icon: '💳',
                        situation: 'A student receives their first credit card with a $2,000 limit. They use it for daily expenses throughout the month and receive the bill at month end.',
                        options: [
                            {
                            text: 'Pay the full balance immediately — treat the card as a debit card, not a loan.',
                            biasLabel: 'Financially literate ✓',
                            biasExplanation: 'Paying the full balance every month means zero interest is charged. The card becomes a tool for convenience and rewards — not a source of debt. This is the foundational rule of credit card use.',
                            isIdeal: true,
                            },
                            {
                            text: 'Pay the minimum payment — keep cash free for other expenses.',
                            biasLabel: 'Minimum payment trap',
                            biasExplanation: 'Credit cards in Singapore charge up to 25% p.a. effective interest on unpaid balances. Paying only the minimum keeps the debt alive and growing — a $1,000 balance at 25% p.a. costs $250 in interest per year.',
                            isIdeal: false,
                            },
                            {
                            text: 'Ignore the bill until a reminder arrives — it\'s only a small balance.',
                            biasLabel: 'Late payment penalty',
                            biasExplanation: 'Late payments trigger penalty fees and interest charges immediately. They also damage credit scores, which affects future loan applications for housing and major purchases.',
                            isIdeal: false,
                            },
                        ],
                        },
                        {
                        icon: '💰',
                        situation: 'A student receives a $500 ang pow during Chinese New Year. They have no emergency fund and $200 outstanding on a credit card at 25% p.a.',
                        options: [
                            {
                            text: 'Clear the $200 credit card balance first, then put the remaining $300 into an emergency fund.',
                            biasLabel: 'Financially literate ✓',
                            biasExplanation: 'Clearing high-interest debt first guarantees a 25% return — better than any savings account or investment. The remaining $300 starts building an emergency fund, which prevents future debt cycles.',
                            isIdeal: true,
                            },
                            {
                            text: 'Put the full $500 into a savings account — start building wealth.',
                            biasLabel: 'Ignoring high-interest debt',
                            biasExplanation: 'Earning 3–4% in a savings account while paying 25% on credit card debt is a net loss. High-interest debt should always be cleared before saving or investing.',
                            isIdeal: false,
                            },
                            {
                            text: 'Spend it — windfalls are for enjoyment, not finances.',
                            biasLabel: 'Present bias',
                            biasExplanation: 'Present bias is the tendency to prioritise immediate enjoyment over future benefit. A $500 windfall deployed strategically has compounding financial benefits — spent immediately, it has none.',
                            isIdeal: false,
                            },
                        ],
                        },
                        {
                        icon: '📈',
                        situation: 'A final-year student has $2,000 in savings and is about to graduate. A friend recommends putting it all into a single "hot stock" they read about online.',
                        options: [
                            {
                            text: 'Keep $1,000 as an emergency fund and invest the other $1,000 in a diversified ETF.',
                            biasLabel: 'Financially literate ✓',
                            biasExplanation: 'Maintaining an emergency fund before investing prevents being forced to sell investments at a loss during unexpected expenses. A diversified ETF spreads risk across hundreds of companies rather than concentrating it in one.',
                            isIdeal: true,
                            },
                            {
                            text: 'Invest the full $2,000 in the recommended stock — higher risk means higher return.',
                            biasLabel: 'Concentration risk',
                            biasExplanation: 'Higher risk does not guarantee higher return — it means a wider range of outcomes, including total loss. Investing without an emergency fund also means any unexpected expense forces a sale, potentially at a loss.',
                            isIdeal: false,
                            },
                            {
                            text: 'Keep all $2,000 in a savings account — investing is too risky right now.',
                            biasLabel: 'Inflation erosion',
                            biasExplanation: 'Keeping money in a low-interest savings account when inflation is 2–3% means losing real purchasing power every year. Some level of investment exposure is necessary to preserve and grow wealth over time.',
                            isIdeal: false,
                            },
                        ],
                        },
                    ],
                    },
                ],
                },

                // ─── Section 3: The Big Three Concepts ───────────────
                {
                key: 'bigthree',
                title: 'The Big Three Concepts',
                fincoins: 10,
                minFincoins: 10,
                content: [
                    {
                    type: 'heading',
                    text: 'The Big Three Concepts',
                    },
                    {
                    type: 'text',
                    text: 'Financial literacy researchers worldwide use three questions as an internationally validated benchmark — known as the "Big Three." These questions test understanding of compound interest, inflation, and risk diversification. Together, they represent the minimum conceptual foundation required to make sound financial decisions. They are used in surveys across 140+ countries to measure and compare financial literacy rates.',
                    },
                    {
                    type: 'timeline',
                    title: 'The Big Three — internationally validated financial literacy benchmark:',
                    nodes: [
                        {
                        icon: '①',
                        label: 'Compound Interest',
                        sublabel: 'Does money grow faster over time?',
                        color: '#4F46E5',
                        examples: ['Savings accounts', 'Investment returns', 'Loan interest'],
                        details: [
                            'Compound interest means earning returns not just on the original principal, but on all previously earned returns as well.',
                            'The effect accelerates over time — the longer money is invested, the faster it grows relative to simple interest.',
                            'It applies in both directions: compound interest on savings builds wealth; compound interest on debt accelerates losses.',
                            'Understanding compound interest is the foundation of both investment planning and debt management.',
                        ],
                        tip: '$1,000 invested at 5% compound interest per year becomes $1,629 after 10 years and $2,653 after 20 years — without adding a single dollar. The second decade adds more than the first.',
                        },
                        {
                        icon: '②',
                        label: 'Inflation',
                        sublabel: 'Does money lose value over time?',
                        color: '#F59E0B',
                        examples: ['Rising grocery prices', 'Increasing rent', 'Falling purchasing power'],
                        details: [
                            'Inflation is the rate at which the general price level rises — meaning the same amount of money buys less over time.',
                            'Singapore\'s average inflation rate is approximately 2–3% per year, though it has spiked higher in recent years.',
                            'Money in a savings account earning less than the inflation rate is losing real value — even if the nominal balance is growing.',
                            'The real return on any investment is the nominal return minus the inflation rate.',
                        ],
                        tip: 'If inflation is 3% and a savings account pays 0.05%, the real return is −2.95%. $10,000 in such an account loses roughly $295 of purchasing power every year.',
                        },
                        {
                        icon: '③',
                        label: 'Risk Diversification',
                        sublabel: 'Does spreading investments reduce risk?',
                        color: '#059669',
                        examples: ['Stocks + bonds', 'ETFs across sectors', 'Multiple asset classes'],
                        details: [
                            'Diversification means spreading investments across different assets so that the failure of any single one does not devastate the entire portfolio.',
                            'When assets are not perfectly correlated — meaning they do not all fall at the same time — diversification reduces overall portfolio volatility.',
                            'An ETF tracking 500 companies means one company going bankrupt has a 0.2% impact rather than a 100% one.',
                            'Geographic diversification — spreading across countries — adds a further layer of protection against localised economic downturns.',
                        ],
                        tip: 'An S&P 500 ETF provides instant diversification across 500 companies in one purchase. A global ETF extends this across thousands of companies in 50+ countries.',
                        },
                    ],
                    },
                    {
                    type: 'bot',
                    label: '💬 Big Three survey results — Singapore vs global financial literacy rates',
                    prompt: 'Big Three financial literacy questions survey results Singapore vs global comparison 2024 2025 Lusardi compound interest inflation diversification',
                    },
                    {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Globally, fewer than 33% of adults can correctly answer all three Big Three questions. In Singapore, the rate is 40% — above the global average, but still meaning 6 in 10 Singaporeans lack foundational financial literacy.',
                    },
                    {
                    type: 'tindertruefalse',
                    exerciseId: '1-1-s3-tinder',
                    fincoins: 10,
                    title: 'The Big Three — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                        {
                        text: 'Compound interest earns returns only on the original principal amount — not on previously earned returns.',
                        isTrue: false,
                        explanation: 'Compound interest earns returns on both the original principal and all previously accumulated returns. This is what distinguishes it from simple interest and what makes it so powerful over long time horizons.',
                        },
                        {
                        text: 'If a savings account pays 1% interest and inflation is 3%, the real purchasing power of money in that account is decreasing.',
                        isTrue: true,
                        explanation: 'Real return = nominal return − inflation = 1% − 3% = −2%. The balance grows nominally but buys less in real terms every year. This is why keeping large amounts in low-interest accounts is a form of financial loss.',
                        },
                        {
                        text: 'Investing all savings in a single company\'s stock provides more protection against loss than a diversified portfolio.',
                        isTrue: false,
                        explanation: 'Concentration in a single stock maximises risk — one bad event can wipe out the entire investment. A diversified portfolio spreads risk so that no single failure causes catastrophic loss.',
                        },
                        {
                        text: 'Financial literacy is defined as the knowledge, skill, and confidence to make informed financial decisions.',
                        isTrue: true,
                        explanation: 'All three components are required. Knowledge alone — without the skill and confidence to apply it — does not constitute financial literacy and does not reliably lead to better financial behaviour.',
                        },
                        {
                        text: 'In Singapore, a majority of adults can correctly answer all three Big Three financial literacy questions.',
                        isTrue: false,
                        explanation: 'Only 40% of Singaporeans can correctly answer all three Big Three questions — meaning 60% cannot. This is above the global average of 33%, but still represents a significant financial literacy gap.',
                        },
                    ],
                    },
                ],
                },

                // ─── Section 4: Put It All Together ──────────────────
                {
                key: 'challenge',
                title: 'Put It All Together',
                fincoins: 15,
                minFincoins: 15,
                content: [
                    {
                    type: 'heading',
                    text: 'Put It All Together',
                    },
                    {
                    type: 'text',
                    text: 'The Big Three questions below are the same ones used in international financial literacy surveys across 140+ countries. They test the three foundational concepts covered in this lesson — compound interest, inflation, and risk diversification.',
                    },
                    {
                    type: 'multistepmcq',
                    exerciseId: '1-1-s4-mcq',
                    fincoins: 15,
                    icon: '🏆',
                    title: 'The Big Three Challenge',
                    questions: [
                        {
                        concept: 'Compound Interest',
                        question: 'A sum of $1,000 is invested at 5% compound interest per year. After 2 years, the total amount is:',
                        options: ['$1,050.00', '$1,100.00', '$1,102.50', '$1,025.00'],
                        correctIndex: 2,
                        explanation: 'Year 1: $1,000 × 1.05 = $1,050. Year 2: $1,050 × 1.05 = $1,102.50. The second year earns interest on $1,050 — not the original $1,000. This is compound interest.',
                        },
                        {
                        concept: 'Inflation',
                        question: 'Inflation is running at 3% per year. A savings account pays 1% per year. After one year, the purchasing power of money in that account has:',
                        options: ['Increased by 1%', 'Stayed the same', 'Decreased by approximately 2%', 'Decreased by 3%'],
                        correctIndex: 2,
                        explanation: 'Real return = nominal interest rate − inflation rate = 1% − 3% = −2%. The money grows in nominal terms but loses purchasing power in real terms.',
                        },
                        {
                        concept: 'Risk Diversification',
                        question: 'All savings are invested in a single company\'s stock. That company goes bankrupt. Compared to a diversified portfolio, the loss is:',
                        options: [
                            'The same — diversification does not affect outcomes',
                            'Smaller — single stocks are easier to monitor',
                            'Larger — concentration risk amplified the loss',
                            'It depends on the size of the investment',
                        ],
                        correctIndex: 2,
                        explanation: 'A diversified portfolio spreads risk — if one asset fails, others cushion the blow. Concentrating everything in one stock means one failure wipes out the entire investment. Diversification directly reduces this risk.',
                        },
                    ],
                    },
                ],
                },
            ],

            flashcards: [
                { q: 'What are the three components of financial literacy?', a: 'Knowledge (understanding financial concepts), skill (ability to apply them), and confidence (willingness to act on them). All three are required — knowledge alone does not constitute literacy.' },
                { q: 'What are the Big Three financial literacy concepts?', a: 'Compound interest, inflation, and risk diversification. These three questions are used as an internationally validated benchmark for financial literacy in surveys across 140+ countries.' },
                { q: 'What is the financial literacy rate in Singapore?', a: 'Approximately 59% of Singaporeans are considered financially literate, and only 40% can correctly answer all three Big Three questions — above the global average of 33%, but still a significant gap.' },
                { q: 'Why does financial literacy matter particularly for university students?', a: 'University is often the first time students make independent financial decisions. Habits formed during this period — budgeting, saving, avoiding debt — are among the most persistent across a lifetime.' },
                { q: 'What is the difference between financial knowledge and financial literacy?', a: 'Knowledge is understanding financial concepts. Literacy also requires the skill to apply them and the confidence to act — someone can know what compound interest is and still keep savings in a 0.05% account.' },
            ],
            },
          {
            id: '1-2',
            title: 'Your Money Mindset',
            icon: '🧩',
            topic: 'Money mindset and psychological relationship with money',
            duration: '6 min',
            fincoins: 45,
            sections: [

              // ─── Section 1: Fixed vs Growth Mindset ──────────────
              {
                key: 'mindset',
                title: 'Fixed vs Growth Mindset',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Fixed vs Growth Money Mindset',
                  },
                  {
                    type: 'text',
                    text: 'How you think about money shapes every financial decision you make. Two people earning the same salary can end up in completely different financial positions — the difference is mindset and habits. A fixed money mindset treats financial ability as something you either have or don\'t. A growth mindset treats it as a skill — one that can be learned, practised, and improved.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Money Mindset',
                    definition: 'The set of beliefs and attitudes you hold about money that shape your financial behaviours. A fixed mindset ("I\'m just bad with money") leads to avoidance and inaction. A growth mindset ("I can learn to manage money") leads to engagement and improvement.',
                  },
                  {
                    type: 'flipcards',
                    exerciseId: '1-2-s1-flip',
                    fincoins: 10,
                    title: 'Fixed → Growth: Reframing money beliefs',
                    cards: [
                      {
                        frontLabel: '❌ Fixed Mindset',
                        backLabel: '✅ Growth Mindset',
                        front: '"I\'m just not good with money."',
                        back: '"Managing money is a skill I can learn — and I\'m already starting."',
                        tag: 'Identity reframe',
                      },
                      {
                        frontLabel: '❌ Fixed Mindset',
                        backLabel: '✅ Growth Mindset',
                        front: '"Investing is too risky and complicated for me."',
                        back: '"I can learn to manage risk through diversification and time in the market."',
                        tag: 'Risk reframe',
                      },
                      {
                        frontLabel: '❌ Fixed Mindset',
                        backLabel: '✅ Growth Mindset',
                        front: '"I\'ll start saving when I earn more."',
                        back: '"I build the habit now with whatever I have — the amount matters less than the behaviour."',
                        tag: 'Habit reframe',
                      },
                      {
                        frontLabel: '❌ Fixed Mindset',
                        backLabel: '✅ Growth Mindset',
                        front: '"Rich people are just lucky or born into it."',
                        back: '"Financial success is largely the result of consistent habits and decisions that compound over time."',
                        tag: 'Attribution reframe',
                      },
                    ],
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '1-2-s1-tinder',
                    fincoins: 10,
                    title: 'Fixed vs Growth Mindset — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'A fixed money mindset means believing financial ability is a talent you either have or don\'t.',
                        isTrue: true,
                        explanation: 'A fixed mindset treats money management as innate — "I\'m just not a money person." This leads to avoidance and inaction because effort feels pointless.',
                      },
                      {
                        text: 'Two people earning the same salary will always end up in similar financial positions.',
                        isTrue: false,
                        explanation: 'Income is only one factor. Mindset, habits, and decisions determine financial outcomes far more than salary alone. Two people on the same income can have completely different financial trajectories.',
                      },
                      {
                        text: 'A growth money mindset treats financial management as a learnable skill.',
                        isTrue: true,
                        explanation: 'Growth mindset means believing you can improve your financial habits through learning and practice — making it far more likely you will actually engage with and improve your finances.',
                      },
                      {
                        text: 'Waiting until you earn more to start saving is a financially sound strategy.',
                        isTrue: false,
                        explanation: 'Waiting to save is the single most common financial mistake. The habit matters more than the amount — someone saving $50/month at 22 will likely outperform someone saving $500/month starting at 32.',
                      },
                    ],
                  },
                ],
              },

              // ─── Section 2: Common Financial Biases ──────────────
              {
                key: 'biases',
                title: 'Common Financial Biases',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Common Financial Biases',
                  },
                  {
                    type: 'text',
                    text: 'Beyond mindset, our brains are wired with cognitive shortcuts called biases — and they quietly sabotage financial decisions every day. Understanding them is the first step to overriding them.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Behavioural economics research shows that cognitive biases — not lack of information — are the primary driver of poor financial decisions. Knowing the right thing to do is not enough if biases push you to do the opposite.',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '🎯',
                        label: 'Present Bias',
                        description: 'Valuing immediate rewards far more than future ones — even when the future reward is objectively better.',
                        color: '#4F46E5',
                        details: [
                          'We instinctively prefer $100 today over $200 next year — even though waiting doubles the money.',
                          'Present bias makes saving feel pointless and spending feel urgent.',
                          'It is the primary reason people consistently fail to follow through on financial intentions.',
                        ],
                        example: '"I\'ll save next month when I have more money" — said every month, indefinitely.',
                      },
                      {
                        icon: '😨',
                        label: 'Loss Aversion',
                        description: 'The pain of losing money feels roughly twice as strong as the pleasure of gaining the same amount.',
                        color: '#DC2626',
                        details: [
                          'Losing $100 feels about twice as bad as gaining $100 feels good.',
                          'This leads to panic selling during market dips and holding bad investments too long.',
                          'Loss aversion makes people irrationally risk-averse — avoiding investments with positive expected value.',
                        ],
                        example: 'Selling all investments when the market drops 10% — locking in a loss right before recovery.',
                      },
                      {
                        icon: '🐑',
                        label: 'Herd Mentality',
                        description: 'Making financial decisions based on what others are doing rather than independent analysis.',
                        color: '#F59E0B',
                        details: [
                          'We assume that if everyone is doing something financially, it must be the right move.',
                          'This leads to buying assets at peak prices because "everyone is making money".',
                          'In Singapore, property obsession is partly driven by herd mentality — "everyone buys HDB" is a social norm, not always the optimal financial decision.',
                        ],
                        example: 'Buying crypto in late 2021 because "everyone is making money" — right before the crash.',
                      },
                      {
                        icon: '💳',
                        label: 'Payment Decoupling',
                        description: 'Digital payments feel less real than cash, making overspending significantly easier.',
                        color: '#7C3AED',
                        details: [
                          'When payment is separated from spending by time or abstraction, the "pain of paying" is reduced.',
                          'Spending $400 on a card feels less painful than handing over $400 in cash.',
                          'Singapore\'s near-cashless infrastructure — PayNow, GrabPay, NETS — makes this bias especially dangerous.',
                        ],
                        example: 'Tapping your phone to pay feels almost free — until the credit card bill arrives.',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 How cognitive biases affect financial decisions in Singapore',
                    prompt: 'cognitive biases financial decisions Singapore behavioural economics research 2024',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '1-2-s2-scenarios',
                    fincoins: 10,
                    title: 'Spot the bias — what\'s driving this decision?',
                    scenarios: [
                      {
                        icon: '💰',
                        situation: 'You receive a $500 bonus. There\'s a Shopee sale ending tonight. You haven\'t saved anything this month.',
                        options: [
                          {
                            text: 'Transfer $400 to savings, spend $100 guilt-free.',
                            biasLabel: 'Rational ✓',
                            biasExplanation: 'You resisted present bias — prioritising future-you before spending on the immediate reward.',
                            isIdeal: true,
                          },
                          {
                            text: 'Browse the sale — it\'s limited time, can\'t miss it.',
                            biasLabel: 'Present Bias',
                            biasExplanation: 'The countdown timer is designed to trigger present bias — making the immediate reward feel more urgent than it really is.',
                            isIdeal: false,
                          },
                          {
                            text: 'Spend most of it — you deserve a treat after working hard.',
                            biasLabel: 'Present Bias',
                            biasExplanation: 'Framing present spending as deserved makes it easier to justify — but the future cost is identical regardless of the reasoning.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '📉',
                        situation: 'Your ETF investment drops 12% in two weeks. A friend says the market will keep falling.',
                        options: [
                          {
                            text: 'Sell everything — I can\'t bear to lose more.',
                            biasLabel: 'Loss Aversion',
                            biasExplanation: 'The pain of a 12% paper loss feels larger than it is — leading to panic selling at exactly the wrong time.',
                            isIdeal: false,
                          },
                          {
                            text: 'Do nothing — short-term volatility is normal for long-term investments.',
                            biasLabel: 'Rational ✓',
                            biasExplanation: 'Market dips are a normal part of long-term investing. Investors who hold through volatility consistently outperform those who panic sell.',
                            isIdeal: true,
                          },
                          {
                            text: 'Follow my friend\'s advice and sell before it drops further.',
                            biasLabel: 'Herd Mentality',
                            biasExplanation: 'Taking financial cues from others rather than your own analysis — especially in volatile markets — is a classic herd mentality trap.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '📱',
                        situation: 'Everyone in your cohort is using GrabPay and spending freely on food delivery. Your budget is tight.',
                        options: [
                          {
                            text: 'Use GrabPay for everything too — it\'s convenient and everyone does it.',
                            biasLabel: 'Herd Mentality + Payment Decoupling',
                            biasExplanation: 'Two biases compounding: social pressure to match peers, and the digital payment reducing the psychological pain of spending.',
                            isIdeal: false,
                          },
                          {
                            text: 'Set a weekly food delivery budget and track it manually.',
                            biasLabel: 'Rational ✓',
                            biasExplanation: 'You counteract payment decoupling by manually tracking spending — making the cost visible and real despite the frictionless payment.',
                            isIdeal: true,
                          },
                          {
                            text: 'Avoid checking your spending — ignorance is bliss.',
                            biasLabel: 'Ostrich Effect',
                            biasExplanation: 'Avoiding financial information doesn\'t change reality — it just means problems grow undetected until they become crises.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ─── Section 3: Building Positive Money Habits ────────
              {
                key: 'habits',
                title: 'Building Positive Money Habits',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Building Positive Money Habits',
                  },
                  {
                    type: 'text',
                    text: 'Knowing about biases is not enough — you need systems that work with your brain, not against it. The habit loop is the proven framework for turning any financial intention into an automatic behaviour.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Research shows it takes an average of 66 days to form a new habit — not 21 days as commonly believed. Financial habits are no different. Consistency over weeks and months is what creates lasting change.',
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
                          'Link saving to an existing, automatic trigger — a salary credit notification is ideal.',
                          'The cue must be consistent and outside your control to build a reliable habit.',
                        ],
                        tip: 'Every time you receive a salary credit alert, that\'s your cue to transfer 20% to savings immediately.',
                      },
                      {
                        icon: '⚙️',
                        label: 'Routine',
                        sublabel: 'The behaviour',
                        color: '#F59E0B',
                        examples: ['Instant bank transfer', 'GIRO instruction', 'Auto-debit'],
                        details: [
                          'Keep the routine as simple and frictionless as possible — a single transfer takes under 10 seconds.',
                          'Automate it where possible so it doesn\'t rely on willpower or memory.',
                        ],
                        tip: 'Set up a standing GIRO instruction so the savings transfer happens automatically on salary day — before you can spend it.',
                      },
                      {
                        icon: '🎁',
                        label: 'Reward',
                        sublabel: 'What makes it stick',
                        color: '#059669',
                        examples: ['Savings balance grows', 'Milestone reached', 'Progress tracker'],
                        details: [
                          'Track your savings balance visually — watching the number grow is a powerful intrinsic reward.',
                          'Set explicit milestones ($500, $1,000, $3,000) and acknowledge each one.',
                        ],
                        tip: 'Open your savings app after every transfer and watch the balance grow — that number is your reward.',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Best saving habits for students in Singapore',
                    prompt: 'best money saving habits university students Singapore practical tips 2024',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '1-2-s3-tinder',
                    fincoins: 10,
                    title: 'Habit Building — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'It takes an average of 21 days to form a new financial habit.',
                        isTrue: false,
                        explanation: 'Research shows habit formation takes an average of 66 days — the 21-day figure is a popular myth. Financial habits in particular require sustained repetition before becoming automatic.',
                      },
                      {
                        text: 'Automating savings removes the need for willpower and makes the habit more reliable.',
                        isTrue: true,
                        explanation: 'Automating savings via GIRO or standing instructions means the behaviour happens regardless of motivation levels on any given day — the most reliable way to build a consistent habit.',
                      },
                      {
                        text: 'The habit loop consists of: Cue → Routine → Reward.',
                        isTrue: true,
                        explanation: 'The habit loop has three components. The cue triggers the behaviour, the routine is the behaviour itself, and the reward reinforces it — making the loop more likely to repeat.',
                      },
                      {
                        text: 'Willpower alone is a reliable strategy for maintaining long-term financial habits.',
                        isTrue: false,
                        explanation: 'Willpower is a finite resource that depletes with use. Systems and automation are far more reliable than willpower for maintaining financial habits over months and years.',
                      },
                    ],
                  },
                ],
              },

              // ─── Section 4: Put It All Together ──────────────────
              {
                key: 'challenge',
                title: 'Put It All Together',
                fincoins: 15,
                content: [
                  {
                    type: 'heading',
                    text: 'Put It All Together',
                  },
                  {
                    type: 'text',
                    text: 'This final section tests your understanding of money mindset, cognitive biases, and habit formation — the three pillars of this lesson.',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '1-2-s4-mcq',
                    fincoins: 15,
                    icon: '🧩',
                    title: 'Money Mindset Challenge',
                    questions: [
                      {
                        concept: 'Growth Mindset',
                        question: 'Which of the following best describes a growth money mindset?',
                        options: [
                          'Believing you are either naturally good or bad with money',
                          'Treating financial management as a learnable skill that improves with practice',
                          'Avoiding financial decisions to prevent making mistakes',
                          'Only engaging with finances once you earn a full-time salary',
                        ],
                        correctIndex: 1,
                        explanation: 'A growth mindset treats financial ability as a skill — not a fixed trait. This belief leads to engagement, learning, and improvement, whereas a fixed mindset leads to avoidance and inaction.',
                      },
                      {
                        concept: 'Loss Aversion',
                        question: 'An investor\'s portfolio drops 15% during a market correction. Loss aversion would most likely cause them to:',
                        options: [
                          'Hold their position and wait for recovery',
                          'Invest more while prices are lower',
                          'Sell all holdings to avoid further losses',
                          'Rebalance their portfolio across asset classes',
                        ],
                        correctIndex: 2,
                        explanation: 'Loss aversion makes the pain of a 15% loss feel disproportionately large — driving panic selling at exactly the wrong moment. Long-term investors who hold through corrections consistently outperform those who sell.',
                      },
                      {
                        concept: 'Habit Loop',
                        question: 'A student wants to save 20% of their allowance every month. Which approach is most likely to succeed long-term?',
                        options: [
                          'Manually transfer savings at the end of each month from whatever is left',
                          'Remind yourself daily to save using willpower',
                          'Set up an automatic transfer on the same day allowance is received each month',
                          'Save only during months when spending is lower than usual',
                        ],
                        correctIndex: 2,
                        explanation: 'Automation removes reliance on willpower and memory — the two most unreliable components of habit maintenance. An automatic transfer on allowance day ensures savings happen first, before spending decisions are made.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              { q: 'What is present bias in personal finance?', a: 'Valuing immediate rewards far more than future ones — e.g. spending today instead of saving for tomorrow, even when saving is objectively better.' },
              { q: 'What is the habit loop for building money habits?', a: 'Cue → Routine → Reward. Attach saving to an automatic trigger like a salary credit alert, keep the routine simple, and track progress as the reward.' },
              { q: 'How does payment decoupling affect spending in Singapore?', a: 'Digital payments (PayNow, GrabPay, cards) reduce the psychological "pain of paying" compared to cash — making it significantly easier to overspend without noticing.' },
              { q: 'What is loss aversion and how does it affect investing?', a: 'The pain of losing money feels roughly twice as strong as the pleasure of gaining the same amount — leading to panic selling during market dips and holding bad investments too long.' },
              { q: 'What is the difference between fixed and growth money mindset?', a: 'Fixed: "I\'m just bad with money — it\'s not for me." Growth: "Managing money is a skill I can learn and improve." Growth mindset leads to engagement and better financial outcomes.' },
            ],
          },
          
          

          // ── LESSON 1-3 ──────────────────────────────
          {
            id: '1-3',
            title: 'Setting Financial Goals',
            icon: '🎯',
            topic: 'Setting SMART financial goals',
            duration: '5 min',
            fincoins: 35,
            sections: [

              // ─── Section 1: Why Goals Change Financial Behaviour ──
              {
                key: 'why',
                title: 'Why Goals Matter',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Why Goals Change Financial Behaviour',
                  },
                  {
                    type: 'text',
                    text: 'People with written financial goals save significantly more and accumulate more wealth than those without. A goal gives every dollar a purpose — and turns vague intentions into concrete decisions. Without a goal, spending decisions are made in isolation. With one, every dollar has a job.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Research shows that people who write down their goals are significantly more likely to achieve them than those who keep goals in their head. The act of writing forces specificity — and specificity drives action.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Financial Goal',
                    definition: 'A specific, time-bound target for your money — such as saving $3,000 for an emergency fund by December, or clearing a credit card balance in 6 months. Goals convert financial intentions into actionable plans.',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '🎯',
                        label: 'Direction',
                        description: 'Goals tell you where to point your money — without them, spending fills every available space.',
                        color: '#4F46E5',
                        details: [
                          'A goal creates a filter for spending decisions — "does this bring me closer to or further from my goal?"',
                          'Without direction, money disappears into small, unmemorable purchases that never add up to anything meaningful.',
                        ],
                        example: 'With a $3,000 emergency fund goal, a $200 impulse purchase becomes a conscious trade-off — not an unconscious habit.',
                      },
                      {
                        icon: '📊',
                        label: 'Measurement',
                        description: 'Goals make progress visible — and visible progress is one of the most powerful motivators.',
                        color: '#059669',
                        details: [
                          'Tracking a savings balance toward a specific target creates momentum — each contribution feels meaningful.',
                          'Without a measurable goal, saving feels abstract and its absence is easy to justify.',
                        ],
                        example: 'Watching a savings balance grow from $0 to $500 to $1,000 toward a $3,000 target is far more motivating than "just saving."',
                      },
                      {
                        icon: '⚡',
                        label: 'Prioritisation',
                        description: 'Goals force you to rank competing uses of money — building the decision-making muscle.',
                        color: '#F59E0B',
                        details: [
                          'Money is finite. Goals force explicit trade-offs between competing wants and needs.',
                          'The habit of prioritising financial goals over impulse spending is one of the strongest predictors of long-term wealth.',
                        ],
                        example: 'Choosing between a weekend trip and three months of emergency fund contributions is easier when you have a clear goal and a deadline.',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Research on financial goals and wealth accumulation',
                    prompt: 'financial goals written goals wealth accumulation savings research evidence 2024',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '1-3-s1-tinder',
                    fincoins: 10,
                    title: 'Why Goals Matter — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'People with written financial goals tend to save more and accumulate more wealth than those without.',
                        isTrue: true,
                        explanation: 'Research consistently shows that written, specific goals lead to better financial outcomes. Writing forces specificity, and specificity drives action and accountability.',
                      },
                      {
                        text: 'Without a financial goal, most people naturally spend within their means.',
                        isTrue: false,
                        explanation: 'Without a goal, spending tends to expand to fill available income — a phenomenon known as lifestyle creep. Goals create the filter that prevents this.',
                      },
                      {
                        text: 'A financial goal makes every spending decision a conscious trade-off rather than an unconscious habit.',
                        isTrue: true,
                        explanation: 'When you have a clear goal, each spending decision is evaluated against it — creating intentionality that gradually replaces impulsive or habitual spending.',
                      },
                      {
                        text: 'Financial goals are only useful once you have a stable income.',
                        isTrue: false,
                        explanation: 'Goals are most important when resources are limited — they help you maximise every dollar. A student saving $100/month toward a goal is building habits that will compound for decades.',
                      },
                    ],
                  },
                ],
              },

              // ─── Section 2: SMART Financial Goals ────────────────
              {
                key: 'smart',
                title: 'SMART Financial Goals',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'SMART Financial Goals',
                  },
                  {
                    type: 'text',
                    text: 'Most financial goals fail not because people lack motivation — but because the goals are too vague to act on. The SMART framework transforms weak intentions into clear, actionable targets.',
                  },
                  {
                    type: 'keyterm',
                    term: 'SMART Goals',
                    definition: 'Specific, Measurable, Achievable, Relevant, Time-bound. A framework for setting goals that are clear enough to act on and concrete enough to track. A goal that fails any of the five criteria is a wish, not a plan.',
                  },
                  {
                    type: 'flipcards',
                    variant: 'neutral',
                    exerciseId: '1-3-s2-flip-smart',
                    fincoins: 0,
                    title: 'The five SMART criteria',
                    cards: [
                      {
                        frontLabel: 'S — Specific',
                        backLabel: '✅ Example',
                        front: '🎯 Specific\n\nYour goal must name exactly what you are saving for and how much. Vague goals cannot be acted on.',
                        back: '"Save $3,000 for an emergency fund" is specific.\n"Save more money" is not.\n\nReplace vague intentions with a named goal and a dollar amount.',
                        tag: 'S — Specific',
                      },
                      {
                        frontLabel: 'M — Measurable',
                        backLabel: '✅ Example',
                        front: '📏 Measurable\n\nAttach a number so you can always tell whether you are on track. Progress you can see is progress that motivates.',
                        back: '"Save $500/month" is measurable.\n"Save a lot" is not.\n\nAdd a monthly contribution amount to every goal.',
                        tag: 'M — Measurable',
                      },
                      {
                        frontLabel: 'A — Achievable',
                        backLabel: '✅ Example',
                        front: '✅ Achievable\n\nA goal should stretch you without being impossible. Unrealistic targets get abandoned early — realistic ones build lasting habits.',
                        back: 'Saving $200/month on a $1,500 allowance is achievable.\nSaving $1,000/month is not.\n\nAim for 10–20% of income.',
                        tag: 'A — Achievable',
                      },
                      {
                        frontLabel: 'R — Relevant',
                        backLabel: '✅ Example',
                        front: '💡 Relevant\n\nA relevant goal fits your current life stage and financial priorities. The right goal at the wrong time still leads to poor outcomes.',
                        back: 'For most students: emergency fund before investing, debt clearance before saving.\n\nOrder matters — relevant means right for now.',
                        tag: 'R — Relevant',
                      },
                      {
                        frontLabel: 'T — Time-bound',
                        backLabel: '✅ Example',
                        front: '⏰ Time-bound\n\nA deadline creates urgency and lets you calculate exactly how much to save each month. Without one, "someday" becomes never.',
                        back: '"By December 2025" is time-bound.\n"Someday" is not.\n\nPick a month and year, then divide the target by months remaining.',
                        tag: 'T — Time-bound',
                      },
                    ],
                  },
                  {
                    type: 'flipcards',
                    exerciseId: '1-3-s2-flip',
                    fincoins: 10,
                    title: 'Vague → SMART: See the transformation',
                    cards: [
                      {
                        frontLabel: '❌ Vague Goal',
                        backLabel: '✅ SMART Goal',
                        front: '"Save more money."',
                        back: '"Save $500/month for 6 months to build a $3,000 emergency fund by June 2025."',
                        tag: 'Specific + Measurable + Time-bound',
                      },
                      {
                        frontLabel: '❌ Vague Goal',
                        backLabel: '✅ SMART Goal',
                        front: '"Invest someday."',
                        back: '"Invest $200/month into an STI ETF starting January, via a robo-advisor like Syfe."',
                        tag: 'Achievable + Relevant + Time-bound',
                      },
                      {
                        frontLabel: '❌ Vague Goal',
                        backLabel: '✅ SMART Goal',
                        front: '"Pay off my debt."',
                        back: '"Clear my $3,000 credit card balance by December by paying $300/month for 10 months."',
                        tag: 'Specific + Measurable + Time-bound',
                      },
                      {
                        frontLabel: '❌ Vague Goal',
                        backLabel: '✅ SMART Goal',
                        front: '"Build an emergency fund before graduation."',
                        back: '"Save $3,700 in a separate OCBC 360 account by June 2026 — $154/month for 24 months."',
                        tag: 'All five SMART criteria met',
                      },
                    ],
                  },
                ],
              },

              // ─── Section 3: Common Goals for Students in Singapore ─
              {
                key: 'singapore',
                title: 'Goals for Students in Singapore',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Common Goals for Students in Singapore',
                  },
                  {
                    type: 'text',
                    text: 'As an international student in Singapore, your financial goals will differ from those of students in your home country. Singapore\'s high cost of living, cashless financial infrastructure, and unique products like CPF make certain goals particularly relevant.',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '🛡️',
                        label: 'Emergency Fund',
                        description: 'The most important financial goal for any student — before investing, before anything else.',
                        color: '#4F46E5',
                        details: [
                          'An emergency fund covers 3–6 months of expenses — for students in Singapore, that\'s roughly $3,000–$6,000.',
                          'It prevents a single unexpected expense (medical, broken laptop, flight home) from creating credit card debt.',
                          'Keep it in a high-yield savings account — OCBC 360 or UOB One — separate from your daily account.',
                        ],
                        example: 'Monthly expenses: $1,200. Emergency fund target: $3,600 (3 months). At $200/month: 18 months to build.',
                      },
                      {
                        icon: '💳',
                        label: 'Zero Credit Card Debt',
                        description: 'Credit cards in Singapore charge up to 26.9% p.a. — clearing debt before saving or investing is always the right move.',
                        color: '#DC2626',
                        details: [
                          'At 26.9% p.a., a $2,000 credit card balance costs $538 in interest per year — more than most savings accounts earn.',
                          'Always pay the full balance monthly. If you already have a balance, clearing it is your highest-priority financial goal.',
                          'A debt-free graduation is one of the most valuable financial positions you can be in.',
                        ],
                        example: '$1,500 credit card balance at 26.9% p.a. = $403/year in interest. Cleared in 6 months at $250/month.',
                      },
                      {
                        icon: '📈',
                        label: 'Start Investing Early',
                        description: 'Starting at 22 versus 32 can nearly double your retirement wealth — due to compounding.',
                        color: '#059669',
                        details: [
                          'Singapore has accessible investment options for students — robo-advisors like Syfe and StashAway require as little as $1 to start.',
                          'A regular savings plan (RSP) investing $100–$200/month into a diversified ETF builds the habit before the salary.',
                          'Time in the market beats timing the market — start small and start early.',
                        ],
                        example: '$150/month invested from age 22 at 7% p.a. = ~$640,000 by age 65. Starting at 32: ~$310,000.',
                      },
                      {
                        icon: '🎓',
                        label: 'Understand CPF Before Working',
                        description: 'As an international student, you don\'t contribute to CPF now — but you will the moment you start working in Singapore.',
                        color: '#F59E0B',
                        details: [
                          'CPF contributions begin from your first paycheck — understanding the system before you start means you can optimise from day one.',
                          'CPF OA, SA, and MA accounts have different interest rates and uses — knowing the difference is a significant financial advantage.',
                          'This is a knowledge goal, not a savings goal — but it has a direct dollar impact on retirement wealth.',
                        ],
                        example: 'An employee earning $4,000/month contributes $800 to CPF and their employer adds $680 — $1,480/month that needs to be managed well.',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Average cost of living for international students in Singapore 2024',
                    prompt: 'average monthly cost of living international university student Singapore 2024 NTU NUS SMU expenses',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '1-3-s3-scenarios',
                    fincoins: 10,
                    title: 'Goal prioritisation — what should come first?',
                    scenarios: [
                      {
                        icon: '💰',
                        situation: 'You have $500 saved. You have a $1,000 credit card balance at 26.9% p.a. and no emergency fund. A friend recommends you start investing in a robo-advisor.',
                        options: [
                          {
                            text: 'Put $500 into the robo-advisor — start building wealth early.',
                            biasLabel: 'Wrong order',
                            biasExplanation: 'Investing while carrying 26.9% p.a. credit card debt is a guaranteed net loss — no investment reliably returns 26.9%. Always clear high-interest debt before investing.',
                            isIdeal: false,
                          },
                          {
                            text: 'Use $500 to partially clear the credit card balance — then save aggressively to clear the rest.',
                            biasLabel: 'Correct priority ✓',
                            biasExplanation: 'Paying down 26.9% debt is a guaranteed 26.9% return — better than any investment. Clear the debt first, then redirect that monthly payment into savings and investments.',
                            isIdeal: true,
                          },
                          {
                            text: 'Keep the $500 as emergency fund and pay the minimum on the credit card.',
                            biasLabel: 'Costly compromise',
                            biasExplanation: 'Minimum payments keep the debt alive at 26.9% p.a. A $1,000 balance paying minimum takes years to clear and costs hundreds in interest. Clear the debt, then rebuild the emergency fund.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '🎯',
                        situation: 'You want to set a financial goal for the next 12 months. Which of these is the most SMART goal?',
                        options: [
                          {
                            text: '"I want to save as much as possible before graduation."',
                            biasLabel: 'Not SMART',
                            biasExplanation: 'No specific amount, no measurable target, no timeframe. This is an intention, not a goal. There\'s no way to track whether you\'re on pace.',
                            isIdeal: false,
                          },
                          {
                            text: '"I will save $200/month for 12 months to build a $2,400 emergency fund by December 2025."',
                            biasLabel: 'SMART goal ✓',
                            biasExplanation: 'Specific ($200/month, emergency fund), Measurable ($2,400), Achievable, Relevant (emergency fund is the right first goal), Time-bound (December 2025).',
                            isIdeal: true,
                          },
                          {
                            text: '"I will try to spend less and save more each month."',
                            biasLabel: 'Not SMART',
                            biasExplanation: 'No numbers, no deadline, no specific target. "Try to" signals low commitment. SMART goals require specificity to generate action.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '🛡️',
                        situation: 'You\'ve just cleared all your debt and have $0 saved. You earn $1,500/month. What should your first financial goal be?',
                        options: [
                          {
                            text: 'Start investing $300/month in an STI ETF immediately.',
                            biasLabel: 'Wrong order',
                            biasExplanation: 'Investing without an emergency fund means any unexpected expense — medical, travel, broken device — forces you to sell investments or take on debt. Build the emergency fund first.',
                            isIdeal: false,
                          },
                          {
                            text: 'Build a $3,000 emergency fund first — save $250/month for 12 months.',
                            biasLabel: 'Correct priority ✓',
                            biasExplanation: 'The emergency fund is the foundation of every other financial goal. It prevents a single unexpected expense from derailing everything else. Once it\'s built, redirect savings into investments.',
                            isIdeal: true,
                          },
                          {
                            text: 'Split evenly — $150/month to emergency fund, $150/month to investments.',
                            biasLabel: 'Suboptimal split',
                            biasExplanation: 'Splitting before the emergency fund is complete leaves you vulnerable for longer. The priority is to build the fund quickly, then shift fully to investing. Speed matters here.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ─── Section 4: Put It All Together ──────────────────
              {
                key: 'challenge',
                title: 'Put It All Together',
                fincoins: 15,
                content: [
                  {
                    type: 'heading',
                    text: 'Put It All Together',
                  },
                  {
                    type: 'text',
                    text: 'This final section tests your understanding of why goals matter, how to make them SMART, and how to prioritise them correctly for your situation as a student in Singapore.',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '1-3-s4-mcq',
                    fincoins: 15,
                    icon: '🎯',
                    title: 'Financial Goals Challenge',
                    questions: [
                      {
                        concept: 'SMART Goals',
                        question: 'Which of the following is the most SMART financial goal?',
                        options: [
                          '"I want to save money this year."',
                          '"I will save $300/month for 10 months to build a $3,000 emergency fund by December 2025."',
                          '"I will try to spend less on food and entertainment."',
                          '"I want to invest before I graduate."',
                        ],
                        correctIndex: 1,
                        explanation: 'Option B meets all five SMART criteria: Specific ($300/month, emergency fund), Measurable ($3,000), Achievable, Relevant (emergency fund is the right first goal), Time-bound (December 2025). The others lack specificity, measurability, or a timeframe.',
                      },
                      {
                        concept: 'Goal Prioritisation',
                        question: 'A student has $800/month disposable income, a $2,000 credit card balance at 26.9% p.a., and no emergency fund. What is the correct order of priorities?',
                        options: [
                          'Start investing first — time in the market is most important',
                          'Build emergency fund first, then clear credit card debt, then invest',
                          'Clear credit card debt first, then build emergency fund, then invest',
                          'Split equally between debt, savings, and investing',
                        ],
                        correctIndex: 2,
                        explanation: 'High-interest debt (26.9% p.a.) must be cleared first — it is a guaranteed negative return that no investment can reliably beat. Once debt is cleared, build the emergency fund. Only then should investing begin.',
                      },
                      {
                        concept: 'Singapore Context',
                        question: 'As an international student in Singapore about to graduate and enter the workforce, which financial goal should you prioritise understanding before your first paycheck?',
                        options: [
                          'How to apply for a credit card with the best rewards',
                          'How the CPF system works and how contributions are allocated',
                          'How to time the stock market for maximum returns',
                          'How to negotiate a higher starting salary',
                        ],
                        correctIndex: 1,
                        explanation: 'CPF contributions begin from your first paycheck — understanding OA, SA, and MA allocations before you start means you can optimise from day one. Missing this knowledge in the first years of work has a compounding cost over a 40-year career.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              { q: 'What does SMART stand for in goal-setting?', a: 'Specific, Measurable, Achievable, Relevant, Time-bound. A goal that fails any of these criteria is a wish, not a plan.' },
              { q: 'Why is having a written financial goal important?', a: 'Written goals are significantly more likely to be achieved — they force specificity, create accountability, and turn vague intentions into actionable plans.' },
              { q: 'What is the correct order of financial priorities for a student with debt and no emergency fund?', a: 'Clear high-interest debt first, then build a 3-month emergency fund, then start investing. Order matters because 26.9% p.a. debt cancels out any investment returns.' },
              { q: 'What is a reasonable emergency fund target for a student in Singapore?', a: '$3,000–$6,000 — roughly 3 months of living expenses. Keep it in a high-yield savings account separate from your daily account.' },
              { q: 'When should international students start learning about CPF?', a: 'Before graduation — CPF contributions begin from your first paycheck, and understanding the system from day one has a compounding impact over a 40-year career.' },
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
            fincoins: 55,
            sections: [
              // ─── SECTION 1 ───────────────────────────
              {
                key: 'what',
                title: 'What a Budget Actually Is',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'What a Budget Actually Is',
                  },
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
                    type: 'subheading',
                    text: 'Budgeting vs. Tracking',
                  },
                  {
                    type: 'text',
                    text: 'Many students confuse budgeting with expense tracking. Tracking is looking back — recording what you already spent. Budgeting is looking forward — deciding where money goes before you spend it. Both matter, but only budgeting changes outcomes.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'A NUS study found that 68% of students in Singapore exceed their monthly budget regularly — but fewer than 20% actively track their spending.',
                  },
                  {
                    type: 'bot',
                    label: '💬 What are the biggest spending categories for students in Singapore?',
                    prompt: 'biggest spending categories monthly expenses university students Singapore 2024',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '2-1-s1-tinder',
                    fincoins: 10,
                    title: 'Budget Basics',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'A budget is a record of what you already spent this month.',
                        isTrue: false,
                        explanation: 'A budget is forward-looking — it allocates money before you spend it. Reviewing past spending is tracking, not budgeting.',
                      },
                      {
                        text: 'Most Singapore students actively track their monthly spending.',
                        isTrue: false,
                        explanation: 'Fewer than 20% track spending — despite 68% regularly exceeding their budget. Awareness is the first gap to close.',
                      },
                      {
                        text: 'Budgeting and expense tracking are the same thing.',
                        isTrue: false,
                        explanation: 'Tracking looks back; budgeting looks forward. You need both, but only budgeting lets you plan before you overspend.',
                      },
                      {
                        text: 'Simply tracking spending — without a formal budget — can reduce expenses by 15–20%.',
                        isTrue: true,
                        explanation: 'Seeing your spending in one place creates accountability. Awareness alone shifts behaviour, even without strict limits.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'why',
                title: 'Why Most Students Don\'t Budget',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Why Most Students Don\'t Budget',
                  },
                  {
                    type: 'text',
                    text: 'Most students avoid budgeting — but the reasons they give don\'t hold up. Every excuse has a practical reframe. Swipe through each one.',
                  },
                  {
                    type: 'flipcards',
                    variant: 'reframe',
                    title: 'Budgeting Excuses → Reality',
                    cards: [
                      {
                        frontLabel: '❌ Excuse',
                        backLabel: '✅ Reality',
                        front: '"My income is irregular — budgeting won\'t work for me."',
                        back: 'Budget based on your lowest expected income month. Any extra becomes bonus savings.',
                      },
                      {
                        frontLabel: '❌ Excuse',
                        backLabel: '✅ Reality',
                        front: '"Budgeting is too restrictive — I\'ll feel deprived."',
                        back: 'A budget includes a Wants category. It gives you guilt-free permission to spend — within a set amount.',
                      },
                      {
                        frontLabel: '❌ Excuse',
                        backLabel: '✅ Reality',
                        front: '"I don\'t earn enough to need a budget."',
                        back: 'Budgeting is most important when money is tight — it makes every dollar work harder.',
                      },
                      {
                        frontLabel: '❌ Excuse',
                        backLabel: '✅ Reality',
                        front: '"I\'ll start budgeting when I have a real job."',
                        back: 'Habits form now. Students who budget in university carry the habit into their careers.',
                      },
                      {
                        frontLabel: '❌ Excuse',
                        backLabel: '✅ Reality',
                        front: '"It takes too much time."',
                        back: 'A weekly 5-minute review is all it takes. Apps like Planner Bee or Seedly make it nearly automatic.',
                      },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore tip: GrabFood, Shopee, and Lazada purchases are the biggest budget-busters for students here. Seeing the monthly total in one place is often a wake-up call.',
                  },
                  {
                    type: 'bot',
                    label: '💬 What budgeting apps are popular among students in Singapore?',
                    prompt: 'best budgeting apps Singapore students Planner Bee Seedly 2024',
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'benefits',
                title: 'What Changes When You Budget',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'What Changes When You Budget',
                  },
                  {
                    type: 'text',
                    text: 'The difference between budgeting and not budgeting isn\'t just about money — it\'s about control, clarity, and confidence. Tap each item below to see what shifts.',
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
                    type: 'subheading',
                    text: 'Budgeting in Real Life',
                  },
                  {
                    type: 'text',
                    text: 'Knowing the theory is one thing — applying it in the moment is another. See which of these real-life scenarios you recognise.',
                  },
                  {
                    type: 'bot',
                    label: '💬 How does budgeting reduce financial stress for students?',
                    prompt: 'budgeting reduce financial anxiety stress university students research',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '2-1-s3-scenarios',
                    fincoins: 10,
                    title: 'Budgeting in Real Life',
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
                            biasLabel: 'Scarcity Bias',
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
                        situation: 'Your allowance just came in — $1,500 for the month. You feel rich. What\'s your first move?',
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
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Budgeting Fundamentals',
                  },
                  {
                    type: 'text',
                    text: 'Three questions covering what a budget is, why students avoid it, and what changes when you use one.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Any last tips before I take the challenge?',
                    prompt: 'key budgeting habits for university students Singapore summary tips',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '2-1-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Budgeting Fundamentals',
                    questions: [
                      {
                        concept: 'What a budget is',
                        question: 'Which of these best describes a budget?',
                        options: [
                          'A record of everything you spent last month',
                          'A plan that tells your money where to go before the month begins',
                          'A savings account with a fixed monthly deposit',
                          'An app that automatically blocks overspending',
                        ],
                        correctIndex: 1,
                        explanation: 'A budget is forward-looking — it allocates income across categories before you spend, not after.',
                      },
                      {
                        concept: 'Common excuses',
                        question: 'A student says "I\'ll start budgeting once I have a stable income." What\'s the best reframe?',
                        options: [
                          'They\'re right — budgeting only works with consistent income',
                          'They should wait until graduation to build the habit',
                          'Habits form now — students who budget carry the habit into their careers',
                          'Irregular income makes budgeting impossible',
                        ],
                        correctIndex: 2,
                        explanation: 'Budgeting habits built during university are the ones that stick. Waiting for "the right time" means the habit never forms.',
                      },
                      {
                        concept: 'Benefits of budgeting',
                        question: 'Which outcome is most directly linked to having a budget?',
                        options: [
                          'Earning a higher income',
                          'Automatically investing every month',
                          'Making intentional trade-offs instead of impulse decisions',
                          'Never having unexpected expenses',
                        ],
                        correctIndex: 2,
                        explanation: 'A budget replaces reactive spending with intentional decisions — you choose trade-offs consciously rather than discovering you overspent.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'What is the core purpose of a budget?',
                a: 'To tell your money where to go before the month starts — not to track where it went after.',
              },
              {
                q: 'What percentage of Singapore students regularly exceed their monthly budget?',
                a: 'Around 68% — but fewer than 20% actively track their spending.',
              },
              {
                q: 'What is the biggest myth about budgeting?',
                a: 'That you need to earn enough to need one. Budgeting is most important when income is limited.',
              },
              {
                q: 'Name two common budget-busters for Singapore students.',
                a: 'Food delivery (GrabFood) and online shopping (Shopee/Lazada).',
              },
              {
                q: 'What is the difference between budgeting and tracking expenses?',
                a: 'Tracking is looking back at spending. Budgeting is planning forward — allocating money before you spend it.',
              },
            ],
          },


          // ── LESSON 2-2 ──────────────────────────────
          {
            id: '2-2',
            title: 'The 50/30/20 Rule',
            icon: '🥧',
            topic: 'The 50/30/20 budgeting framework applied to Singapore student life',
            duration: '6 min',
            fincoins: 45,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'rule',
                title: 'The 50/30/20 Framework',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'The 50/30/20 Framework',
                  },
                  {
                    type: 'text',
                    text: 'Most budgeting systems are complicated — dozens of categories, endless tracking, and easy to abandon. The 50/30/20 rule cuts through all of that with just three buckets: Needs, Wants, and Savings.',
                  },
                  {
                    type: 'keyterm',
                    term: '50/30/20 Rule',
                    definition: 'A budgeting framework that splits after-tax income into three categories: 50% for Needs, 30% for Wants, and 20% for Savings or debt repayment.',
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
                    type: 'bot',
                    label: '💬 What is the average student allowance in Singapore?',
                    prompt: 'average monthly allowance stipend international student Singapore university 2024',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '2-2-s1-tinder',
                    fincoins: 10,
                    title: 'The 50/30/20 Framework',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'Under the 50/30/20 rule, half your income goes towards things you need to live.',
                        isTrue: true,
                        explanation: '50% covers non-negotiables like rent, transport, groceries, and phone — essentials you can\'t cut without impacting daily life.',
                      },
                      {
                        text: 'Savings should only be set aside after you\'ve covered Needs and Wants.',
                        isTrue: false,
                        explanation: 'Savings should be transferred first on income day — not last. Waiting to "save what\'s left" usually means nothing is left.',
                      },
                      {
                        text: 'GrabFood delivery counts as a Need under the 50/30/20 rule.',
                        isTrue: false,
                        explanation: 'Food delivery is a Want — it\'s convenient but cuttable. Buying groceries or eating at a hawker centre is the Need equivalent.',
                      },
                      {
                        text: 'On a $2,000/month income, the savings target under 50/30/20 is $400.',
                        isTrue: true,
                        explanation: '20% of $2,000 = $400. That\'s $4,800 saved per year — a meaningful emergency fund built entirely on a student income.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'singapore',
                title: 'Applying It in Singapore',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Applying It in Singapore',
                  },
                  {
                    type: 'text',
                    text: 'The 50/30/20 rule is a global framework — but Singapore has its own cost realities. Knowing what fits in each bucket here makes it immediately actionable.',
                  },
                  {
                    type: 'subheading',
                    text: 'What Counts as a Need Here?',
                  },
                  {
                    type: 'bullets',
                    title: 'Singapore-specific Needs to account for:',
                    items: [
                      '🚌 MRT/bus transport: $80–$150/month (cheaper with student concession card)',
                      '🏠 Hall/HDB rent: $300–$900/month depending on campus and room type',
                      '🍜 Hawker centre meals average $4–$6 (vs $12–$18 at restaurants)',
                      '📱 SIM-only mobile plans: $10–$25/month with Circles.Life or Giga',
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: If your rent is high (e.g. private housing), your Needs may exceed 50%. In that case, reduce Wants to 20% and protect Savings at 20% minimum.',
                  },
                  {
                    type: 'subheading',
                    text: 'Needs vs. Wants — Singapore Edition',
                  },
                  {
                    type: 'flipcards',
                    variant: 'neutral',
                    title: 'Is it a Need or a Want?',
                    cards: [
                      {
                        frontLabel: '🤔 Category',
                        backLabel: '📋 Answer',
                        front: 'MRT/bus fare to campus every day',
                        back: 'NEED — essential transport with no cheaper alternative for most students.',
                        tag: '🏠 Needs (50%)',
                      },
                      {
                        frontLabel: '🤔 Category',
                        backLabel: '📋 Answer',
                        front: 'GrabFood delivery instead of cooking or eating at the hawker centre',
                        back: 'WANT — convenient but cuttable. Switching to hawker meals saves $8–$12 per meal.',
                        tag: '🎉 Wants (30%)',
                      },
                      {
                        frontLabel: '🤔 Category',
                        backLabel: '📋 Answer',
                        front: 'Netflix, Spotify, Disney+ subscriptions',
                        back: 'WANT — enjoyable but optional. Share plans with friends or use free tiers to cut costs.',
                        tag: '🎉 Wants (30%)',
                      },
                      {
                        frontLabel: '🤔 Category',
                        backLabel: '📋 Answer',
                        front: 'Phone bill — SIM-only plan at $15/month',
                        back: 'NEED — communication is essential. But upgrade plans (e.g. $60+ unlimited) push into Want territory.',
                        tag: '🏠 Needs (50%)',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 How much does it cost to live in a university hall in Singapore?',
                    prompt: 'NTU NUS SMU university hall accommodation cost per month Singapore 2024',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '2-2-s2-scenarios',
                    fincoins: 10,
                    title: 'Needs or Wants?',
                    scenarios: [
                      {
                        icon: '🍜',
                        situation: 'You usually eat at the campus hawker centre ($5/meal) but lately you\'ve been ordering GrabFood ($15/meal) every day. Your Needs are over 60% of income. What do you do?',
                        options: [
                          {
                            text: 'Keep ordering GrabFood — it saves time.',
                            biasLabel: 'Convenience Bias',
                            biasExplanation: 'Delivery convenience is a Want, not a Need. At $15/meal vs $5, you\'re spending $300 extra per month just on food delivery.',
                            isIdeal: false,
                          },
                          {
                            text: 'Switch back to hawker meals — reclassify delivery as a Want with a weekly cap.',
                            biasLabel: 'Rational choice ✓',
                            biasExplanation: 'Hawker meals are a Need; delivery is a Want. Capping delivery to 1–2x per week saves $200+ and fixes your Needs ratio.',
                            isIdeal: true,
                          },
                          {
                            text: 'Reduce your Savings to compensate.',
                            biasLabel: 'Wrong lever',
                            biasExplanation: 'Savings should be the last thing you cut, not the first. Trim Wants before touching your financial safety net.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '📱',
                        situation: 'Your phone plan is $65/month (unlimited data + roaming). A SIM-only plan costs $18/month. You\'re exceeding your Needs budget every month.',
                        options: [
                          {
                            text: 'Keep the expensive plan — data is essential.',
                            biasLabel: 'Creeping Need',
                            biasExplanation: 'Basic connectivity is a Need; premium features like unlimited data or roaming are Wants. The $47 difference belongs in Wants.',
                            isIdeal: false,
                          },
                          {
                            text: 'Switch to the $18 plan and count the difference as freed-up Wants budget.',
                            biasLabel: 'Rational choice ✓',
                            biasExplanation: 'The $18 plan covers the Need. The $47 saved can fund other Wants or top up Savings — a much better allocation.',
                            isIdeal: true,
                          },
                          {
                            text: 'Ask your parents to pay for it.',
                            biasLabel: 'Avoidance',
                            biasExplanation: 'Offloading costs doesn\'t help you build budgeting skills. The goal is to work within your own income — even if you could ask for help.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '🏠',
                        situation: 'Your hall rent is $750/month on a $1,500 allowance — already 50% of income. A friend offers you a cheaper off-campus room at $500/month. What do you consider?',
                        options: [
                          {
                            text: 'Stay in hall — campus convenience is worth it.',
                            biasLabel: 'Status Quo Bias',
                            biasExplanation: 'Comfort and familiarity are real, but $250/month difference = $3,000/year. That\'s a meaningful trade-off worth evaluating consciously.',
                            isIdeal: false,
                          },
                          {
                            text: 'Evaluate total cost: rent + added transport vs. current hall cost.',
                            biasLabel: 'Rational choice ✓',
                            biasExplanation: 'Off-campus may add $50–$80/month in transport but still net $170+ savings. Running the real numbers is always the right move.',
                            isIdeal: true,
                          },
                          {
                            text: 'Move immediately — cheaper is always better.',
                            biasLabel: 'Oversimplification',
                            biasExplanation: 'Cheaper rent isn\'t automatically better — added transport, food costs, and time matter. Always calculate the full picture.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'adapt',
                title: 'Adapting the Rule to Your Situation',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Adapting the Rule to Your Situation',
                  },
                  {
                    type: 'text',
                    text: 'The 50/30/20 rule is a starting point — not a rigid law. Real student budgets in Singapore often need adjustments. Here\'s how to flex the framework without breaking its logic.',
                  },
                  {
                    type: 'subheading',
                    text: 'How to Apply It Step by Step',
                  },
                  {
                    type: 'steps',
                    title: 'Setting up 50/30/20 for the first time:',
                    steps: [
                      'Calculate your monthly after-tax income (allowance + part-time earnings)',
                      'Multiply by 0.5 — this is your Needs ceiling',
                      'Multiply by 0.3 — this is your Wants allowance',
                      'Multiply by 0.2 — transfer this to savings on the day income arrives',
                      'Track spending across categories using Seedly, Planner Bee, or a spreadsheet',
                    ],
                  },
                  {
                    type: 'subheading',
                    text: 'When the Rule Needs Adjusting',
                  },
                  {
                    type: 'flipcards',
                    variant: 'neutral',
                    title: 'Common adjustments — and how to handle them',
                    cards: [
                      {
                        frontLabel: '⚠️ Situation',
                        backLabel: '✅ Adjustment',
                        front: 'Your rent takes up 55–60% of income on its own.',
                        back: 'Use a 60/20/20 split: Needs = 60%, Wants = 20%, Savings = 20%. Keep savings sacred.',
                        tag: 'High-rent adaptation',
                      },
                      {
                        frontLabel: '⚠️ Situation',
                        backLabel: '✅ Adjustment',
                        front: 'You have a student loan or bursary repayment.',
                        back: 'Debt repayment counts as Savings (20%). Prioritise it above investments — guaranteed return equals the interest rate.',
                        tag: 'Debt-first adaptation',
                      },
                      {
                        frontLabel: '⚠️ Situation',
                        backLabel: '✅ Adjustment',
                        front: 'Your income is irregular — part-time gigs, tutoring, freelance.',
                        back: 'Budget on your lowest expected month. Any income above that is bonus — split 50% to savings, 50% to Wants.',
                        tag: 'Irregular income adaptation',
                      },
                    ],
                  },
                  {
                    type: 'subheading',
                    text: 'Your Personal Calculator',
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
                    type: 'callout',
                    variant: 'tip',
                    text: 'The one rule that shouldn\'t flex: always transfer Savings first. Reduce Wants before touching your 20% savings target.',
                  },
                  {
                    type: 'bot',
                    label: '💬 How should I adjust 50/30/20 if I have a student loan in Singapore?',
                    prompt: '50/30/20 budgeting adaptation student loan debt repayment Singapore university',
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: The 50/30/20 Rule',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on the framework, how it applies in Singapore, and how to adapt it when life doesn\'t fit neatly into 50/30/20.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — what are the key 50/30/20 rules to remember?',
                    prompt: '50/30/20 budgeting rule key principles summary Singapore students',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '2-2-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'The 50/30/20 Rule',
                    questions: [
                      {
                        concept: 'The framework',
                        question: 'Under the 50/30/20 rule, which category should you transfer first when your income arrives?',
                        options: [
                          'Needs — pay rent and bills immediately',
                          'Wants — reward yourself before budgeting',
                          'Savings — pay yourself first before any spending',
                          'Split equally and spend as needed',
                        ],
                        correctIndex: 2,
                        explanation: 'Savings should always be transferred first. Waiting to "save what\'s left" means there\'s usually nothing left at month-end.',
                      },
                      {
                        concept: 'Singapore context',
                        question: 'A student pays $750/month in hall rent on a $1,500 allowance. Which statement is correct?',
                        options: [
                          'Their budget is fine — rent is a Need so it doesn\'t count against the 50% limit',
                          'Their Needs are already at 50% from rent alone — other essentials must fit in the remaining 0%',
                          'They should immediately move off-campus without evaluating total costs',
                          'They should reduce Savings to 10% to free up space in their budget',
                        ],
                        correctIndex: 1,
                        explanation: 'Rent alone consuming the full 50% means transport, food, and phone must come from Wants. The fix is either reducing rent or shifting to a 60/20/20 split — not cutting Savings.',
                      },
                      {
                        concept: 'Adapting the rule',
                        question: 'A student\'s income is irregular — some months $800, others $2,000. What\'s the best 50/30/20 approach?',
                        options: [
                          'Skip budgeting until income stabilises',
                          'Budget based on the highest income month to stay motivated',
                          'Budget based on the lowest expected income month; save any extra as bonus',
                          'Spend freely in high-income months and restrict in low-income months',
                        ],
                        correctIndex: 2,
                        explanation: 'Budgeting for the floor prevents shortfalls in low months. Any income above the baseline is a bonus — direct it to savings before discretionary spending.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'What are the three buckets of the 50/30/20 rule?',
                a: '50% Needs (essentials), 30% Wants (lifestyle), 20% Savings or debt repayment.',
              },
              {
                q: 'On a $2,000/month income, how much goes to savings under 50/30/20?',
                a: '$400/month — transferred immediately when income arrives.',
              },
              {
                q: 'What counts as a "Need" vs a "Want" in Singapore?',
                a: 'Need: rent, MRT, groceries, tuition. Want: GrabFood delivery, Shopee, Netflix, dining out.',
              },
              {
                q: 'Why should you transfer savings first, before spending?',
                a: 'Waiting to "save what\'s left" means nothing is usually left — pay yourself first.',
              },
              {
                q: 'What should you do if rent takes up more than 50% of income?',
                a: 'Shift to a 60/20/20 split — reduce Wants to 20% and keep Savings at 20% minimum.',
              },
            ],
          },

          // ── LESSON 2-3 ──────────────────────────────
          {
            id: '2-3',
            title: 'Tracking Your Spending',
            icon: '🔍',
            topic: 'Expense tracking methods and tools for students in Singapore',
            duration: '5 min',
            fincoins: 45,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'why',
                title: 'Why Tracking Is Powerful',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Why Tracking Is Powerful',
                  },
                  {
                    type: 'text',
                    text: 'You cannot manage what you don\'t measure. Expense tracking turns vague feelings about money into concrete data — and data is what drives change.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Expense Tracking',
                    definition: 'The habit of recording every transaction — what you spent, how much, and which category it belongs to — so you can compare actual spending against your budget.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Studies show that people who track their spending reduce discretionary expenses by an average of 15–20% in the first month — just from awareness alone.',
                  },
                  {
                    type: 'subheading',
                    text: 'Tracking vs. Budgeting — What\'s the Difference?',
                  },
                  {
                    type: 'text',
                    text: 'Budgeting plans where money goes before you spend. Tracking records where it actually went. You need both — a budget without tracking is just a wish list, and tracking without a budget is just data with no direction.',
                  },
                  {
                    type: 'timeline',
                    title: 'The tracking habit loop',
                    nodes: [
                      {
                        icon: '📥',
                        label: 'Income arrives',
                        sublabel: 'Start of the month',
                        color: '#4F46E5',
                        details: [
                          'Transfer your 20% savings immediately',
                          'Set your Needs and Wants ceilings for the month',
                        ],
                        tip: 'Do this within 24 hours of receiving your allowance or pay.',
                      },
                      {
                        icon: '📝',
                        label: 'Log transactions',
                        sublabel: 'Throughout the month',
                        color: '#F59E0B',
                        details: [
                          'Record each spend in your app or spreadsheet',
                          'Categorise as Need, Want, or Savings',
                        ],
                        tip: 'Enable bank transaction notifications — each ping is a built-in reminder to log.',
                      },
                      {
                        icon: '🔍',
                        label: 'Weekly review',
                        sublabel: 'Every Sunday, 5 minutes',
                        color: '#059669',
                        details: [
                          'Compare actual vs. planned spending per category',
                          'Identify the one category that went over',
                          'Decide one adjustment for the coming week',
                        ],
                        tip: 'Sunday evening works well — you\'re planning the week ahead anyway.',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 How does expense tracking change financial behaviour?',
                    prompt: 'expense tracking behaviour change spending reduction research students',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '2-3-s1-tinder',
                    fincoins: 10,
                    title: 'Tracking — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'Tracking your spending can reduce expenses by 15–20% without changing your budget.',
                        isTrue: true,
                        explanation: 'Awareness alone shifts behaviour. Seeing the total in one place creates accountability — no willpower or budget change required.',
                      },
                      {
                        text: 'A budget is all you need — tracking is unnecessary if you have a plan.',
                        isTrue: false,
                        explanation: 'A budget without tracking is just a plan — tracking closes the feedback loop and tells you whether you\'re sticking to it.',
                      },
                      {
                        text: 'The best time to do a weekly spending review is Sunday.',
                        isTrue: true,
                        explanation: 'Sunday sits at the end of one week and the start of another — perfect for reviewing what happened and adjusting for the week ahead.',
                      },
                      {
                        text: 'You should wait until month-end to review your spending.',
                        isTrue: false,
                        explanation: 'Monthly reviews catch problems too late — you\'ve already overspent by the time you check. Weekly reviews let you course-correct mid-month.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'methods',
                title: 'Three Ways to Track',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Three Ways to Track',
                  },
                  {
                    type: 'text',
                    text: 'There\'s no single best way to track spending — the best method is the one you\'ll actually stick to. Each approach has different trade-offs depending on your habits.',
                  },
                  {
                    type: 'subheading',
                    text: 'The Three Main Methods',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '📊',
                        label: 'Spreadsheet',
                        description: 'Build your own tracking system in Google Sheets or Excel.',
                        color: '#4F46E5',
                        details: [
                          'Fully customisable — your categories, your layout',
                          'Free and works offline',
                          'Requires manual entry — takes 5–10 minutes a week',
                          'Best for detail-oriented people who want full control',
                        ],
                        example: 'Create columns for Date, Description, Category (Need/Want/Savings), Amount. Use SUMIF to total each category automatically.',
                      },
                      {
                        icon: '📱',
                        label: 'Tracking App',
                        description: 'Link your Singapore bank account for automatic transaction import.',
                        color: '#059669',
                        details: [
                          'Auto-pulls transactions from DBS, OCBC, UOB, Maybank',
                          'Categorises spending with minimal manual effort',
                          'Sends alerts when you approach your budget limit',
                          'Best for students who want low-friction, automatic tracking',
                        ],
                        example: 'Seedly links to your bank and automatically sorts each transaction into categories — review takes under 2 minutes a week.',
                      },
                      {
                        icon: '✉️',
                        label: 'Cash Envelopes',
                        description: 'Divide physical cash into labelled envelopes for each category.',
                        color: '#F59E0B',
                        details: [
                          'Creates a hard stop — when the envelope is empty, spending stops',
                          'The physical act of handing over cash reduces impulse spending',
                          'Less practical in Singapore\'s cashless environment',
                          'Best for students who consistently overspend on food or shopping',
                        ],
                        example: 'Withdraw your weekly food budget in cash ($70). When it\'s gone, hawker meals only — no GrabFood until next week.',
                      },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: Enable transaction notifications on your DBS, OCBC, or UOB app. Each ping is a micro-reminder of your spending — far more effective than reviewing at month-end.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Is the cash envelope system practical in cashless Singapore?',
                    prompt: 'cash envelope budgeting system Singapore cashless PayNow practical 2024',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '2-3-s2-scenarios',
                    fincoins: 10,
                    title: 'Which tracking method fits you?',
                    scenarios: [
                      {
                        icon: '📊',
                        situation: 'You want full control over your categories and love custom breakdowns. You don\'t mind spending 10 minutes a week on it.',
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
                            biasExplanation: 'Envelopes enforce hard limits but don\'t give analytics or custom reports — and Singapore is largely cashless.',
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
                            biasExplanation: 'Physical cash creates a hard stop that digital payments can\'t replicate. The pain of handing over cash reduces impulse spending.',
                            isIdeal: true,
                          },
                          {
                            text: 'Seedly app — track digitally with bank integration.',
                            biasLabel: 'Good but softer limit',
                            biasExplanation: 'Seedly shows you when you\'ve overspent but doesn\'t physically prevent it — requires more self-discipline.',
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
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'tools',
                title: 'Best Tools for Singapore Students',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Best Tools for Singapore Students',
                  },
                  {
                    type: 'text',
                    text: 'Here are the four best expense tracking apps for students in Singapore — tap each one to see features, cost, and whether it\'s right for you.',
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
                        singaporeTip: 'Seedly also has a "Financial Health Score" that benchmarks your spending against other Singapore users your age.',
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
                    type: 'subheading',
                    text: 'The 5-Minute Weekly Review',
                  },
                  {
                    type: 'text',
                    text: 'Whichever app you choose, the habit that makes it work is a consistent weekly review. Here\'s the exact routine.',
                  },
                  {
                    type: 'steps',
                    title: 'The 5-minute weekly review:',
                    steps: [
                      'Every Sunday, open your tracking app or bank statement',
                      'Check actual vs. planned spending in each 50/30/20 category',
                      'Identify the one category that went over budget',
                      'Decide one adjustment for the coming week',
                      'Repeat — takes 5 minutes and builds lasting financial awareness',
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Which budgeting app is most popular among Singapore students?',
                    prompt: 'most popular budgeting expense tracking app Singapore students 2024',
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Tracking Your Spending',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on why tracking matters, which method fits which situation, and the best tools for Singapore students.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — what makes a good expense tracking habit?',
                    prompt: 'expense tracking habit best practices consistency weekly review students',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '2-3-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Tracking Your Spending',
                    questions: [
                      {
                        concept: 'Why tracking works',
                        question: 'A student starts logging every transaction without changing their budget. What is the most likely outcome?',
                        options: [
                          'No change — you need a strict budget for tracking to matter',
                          'They spend more because they feel more in control',
                          'Discretionary spending drops 15–20% just from awareness',
                          'Tracking only helps if done daily, not weekly',
                        ],
                        correctIndex: 2,
                        explanation: 'Awareness alone changes behaviour. Seeing exactly where money goes creates accountability without needing any other change — this is the power of tracking.',
                      },
                      {
                        concept: 'Choosing a tracking method',
                        question: 'A student consistently overspends on GrabFood and Shopee. Which tracking method is most likely to help them stop?',
                        options: [
                          'Seedly app — it categorises digital transactions automatically',
                          'Monthly bank statement review — see the damage at month-end',
                          'Cash envelope system — physical cash creates a hard spending limit',
                          'Google Sheets — custom categories give full visibility',
                        ],
                        correctIndex: 2,
                        explanation: 'Physical cash creates a hard stop that digital tracking can\'t. Once the envelope is empty, spending stops — apps show you\'ve overspent but don\'t prevent it.',
                      },
                      {
                        concept: 'Singapore tools',
                        question: 'Which tracking app is best for a student who banks with DBS and wants zero setup or extra apps?',
                        options: [
                          'Seedly — best overall with multi-bank integration',
                          'Money Manager — offline and private',
                          'DBS NAV Planner — built into the DBS app, zero setup needed',
                          'Syfe — best for tracking investments and net worth',
                        ],
                        correctIndex: 2,
                        explanation: 'DBS NAV Planner auto-categorises all DBS/POSB transactions with no extra app or setup required. For DBS customers it\'s the path of least resistance.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'By how much do people typically reduce spending just by tracking?',
                a: '15–20% in the first month — awareness alone changes behaviour.',
              },
              {
                q: 'What is the best expense tracking app for Singapore students?',
                a: 'Seedly — it\'s Singapore-focused, links to local banks, and is free.',
              },
              {
                q: 'What is the 5-minute weekly financial review?',
                a: 'Check actual vs. planned spending each Sunday, identify what went over, and plan one adjustment for the week ahead.',
              },
              {
                q: 'What bank feature helps Singapore students track spending passively?',
                a: 'Transaction notifications on DBS/OCBC/UOB apps — each ping creates micro-awareness of spending.',
              },
              {
                q: 'What is the difference between the cash envelope system and an app?',
                a: 'Envelopes use physical cash to enforce hard limits. Apps track digitally — better for Singapore\'s cashless society but softer on enforcement.',
              },
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
          // ── LESSON 3-1 ──────────────────────────────
          {
            id: '3-1',
            title: 'Why You Need an Emergency Fund',
            icon: '🛡️',
            topic: 'Emergency funds — purpose, size, and why they matter',
            duration: '5 min',
            fincoins: 55,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'what',
                title: 'What an Emergency Fund Is (and Isn\'t)',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'What an Emergency Fund Is (and Isn\'t)',
                  },
                  {
                    type: 'text',
                    text: 'An emergency fund is a dedicated pool of cash set aside for genuine financial emergencies — not planned expenses, not wants, and definitely not "opportunities". It is the foundation of every financial plan.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Emergency Fund',
                    definition: 'A separate, liquid cash reserve covering 3–6 months of essential expenses — held exclusively for genuine financial crises, not planned costs or discretionary spending.',
                  },
                  {
                    type: 'subheading',
                    text: 'Real Emergency vs. Not an Emergency',
                  },
                  {
                    type: 'text',
                    text: 'The hardest part of an emergency fund is protecting it. Many students raid it for things that feel urgent but aren\'t. Here\'s the line.',
                  },
                  {
                    type: 'table',
                    headers: ['✅ Real Emergency', '❌ Not an Emergency'],
                    rows: [
                      ['Medical bill from an accident', 'Flight home for a holiday'],
                      ['Laptop breaks, needed for class', 'Laptop upgrade (old one still works)'],
                      ['Job loss — covering rent gap', 'Sale on Shopee you "can\'t miss"'],
                      ['Family crisis requiring travel', 'Concert tickets'],
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'warning',
                    text: 'The most common emergency fund mistake: using it for something that "felt like an emergency" — a sale, a trip, an impulse buy. Once spent, it takes months to rebuild.',
                  },
                  {
                    type: 'bot',
                    label: '💬 What counts as a financial emergency for students?',
                    prompt: 'what counts as financial emergency students Singapore examples unexpected expenses',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '3-1-s1-tinder',
                    fincoins: 10,
                    title: 'Emergency or Not?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'A Shopee sale you "can\'t miss" is a valid reason to dip into your emergency fund.',
                        isTrue: false,
                        explanation: 'Sales are discretionary spending — a Want, not an emergency. The emergency fund is for crises that would otherwise send you into debt.',
                      },
                      {
                        text: 'Your laptop breaking mid-semester when you need it for submissions counts as an emergency.',
                        isTrue: true,
                        explanation: 'A broken essential tool affecting your academic performance with no cheap alternative is a genuine emergency — this is exactly what the fund is for.',
                      },
                      {
                        text: 'An emergency fund should be kept in your main daily spending account for easy access.',
                        isTrue: false,
                        explanation: 'Keeping it separate — in a different account — creates a psychological barrier that prevents casual dipping. Easy access to your main account makes it too tempting to spend.',
                      },
                      {
                        text: 'Unexpected medical bills are a valid use of an emergency fund.',
                        isTrue: true,
                        explanation: 'Medical emergencies are exactly what the fund exists for — unplanned, urgent, and impossible to cover from regular monthly spending.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'size',
                title: 'How Much You Actually Need',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'How Much You Actually Need',
                  },
                  {
                    type: 'text',
                    text: 'The standard recommendation is 3–6 months of essential expenses. For students in Singapore, that\'s roughly $3,000–$6,000 depending on your rent and lifestyle.',
                  },
                  {
                    type: 'subheading',
                    text: 'How to Calculate Your Target',
                  },
                  {
                    type: 'steps',
                    title: 'Calculate your emergency fund target:',
                    steps: [
                      'Add up your monthly essentials: rent + food + transport + phone',
                      'Multiply by 3 for a starter fund, or by 6 for a full fund',
                      'Example: $800 rent + $300 food + $120 transport + $20 phone = $1,240/month',
                      'Starter fund target: $1,240 × 3 = $3,720',
                      'Keep this in a separate savings account — not your daily account',
                    ],
                  },
                  {
                    type: 'slider',
                    icon: '🛡️',
                    title: 'Emergency Fund Calculator',
                    description: 'Drag to your monthly essential expenses to see your fund targets.',
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
                    type: 'subheading',
                    text: 'Where to Keep It in Singapore',
                  },
                  {
                    type: 'text',
                    text: 'Your emergency fund needs to be two things: accessible when you need it, and separate enough that you won\'t casually spend it. These Singapore options hit both.',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '🏦',
                        label: 'High-Yield Savings Account',
                        description: 'OCBC 360 or UOB One — earn 2–4% while keeping funds fully liquid.',
                        color: '#4F46E5',
                        details: [
                          'Withdrawable any time — no lock-in period',
                          'Interest rates up to 4% p.a. with qualifying conditions',
                          'Keep it separate from your daily spending account',
                        ],
                        example: 'Open an OCBC 360 account solely for your emergency fund. Transfer your $200/month contribution on income day.',
                      },
                      {
                        icon: '📜',
                        label: 'Singapore Savings Bond (SSB)',
                        description: 'Government-backed, redeemable any month, earns above-average interest.',
                        color: '#059669',
                        details: [
                          'Backed by the Singapore government — zero default risk',
                          'Redeem any month with no penalty — 1 month notice needed',
                          'Interest rates typically 2.5–3.5% p.a.',
                        ],
                        example: 'Once your fund reaches $1,000+, move part of it into SSB for better returns. Keep $500–$1,000 in a savings account for instant access.',
                      },
                      {
                        icon: '⚠️',
                        label: 'Standard Savings Account (Avoid)',
                        description: 'Typical DBS/OCBC savings accounts earn only 0.05% — your money loses value to inflation.',
                        color: '#F59E0B',
                        details: [
                          'Interest rate: 0.05% p.a. — almost nothing',
                          'Fine for daily transactions, terrible for storing savings',
                          'Inflation erodes the real value of money sitting here',
                        ],
                        example: 'If you keep $3,000 in a 0.05% account, you earn $1.50/year. In an OCBC 360 at 2.5%, you earn $75/year.',
                      },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: Keep your emergency fund in a Singapore Savings Bond or high-yield savings account — not a standard 0.05% account. You earn more while keeping it accessible.',
                  },
                  {
                    type: 'bot',
                    label: '💬 What is the current SSB interest rate in Singapore?',
                    prompt: 'Singapore Savings Bond SSB current interest rate 2025',
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'without',
                title: 'What Happens Without One',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'What Happens Without One',
                  },
                  {
                    type: 'text',
                    text: 'Most students think "I\'ll deal with emergencies when they happen." But without a fund, your only options in a crisis are all bad. Here\'s what the domino effect looks like.',
                  },
                  {
                    type: 'timeline',
                    title: 'The no-emergency-fund crisis chain',
                    nodes: [
                      {
                        icon: '💥',
                        label: 'Crisis hits',
                        sublabel: 'Unexpected expense appears',
                        color: '#DC2626',
                        details: [
                          'Medical bill, broken laptop, sudden job loss',
                          'You need $500–$2,000 immediately',
                          'No emergency fund means no buffer',
                        ],
                        tip: 'This is not rare — most people face at least one financial shock per year.',
                      },
                      {
                        icon: '💳',
                        label: 'Bad options only',
                        sublabel: 'You scramble for cash',
                        color: '#F59E0B',
                        details: [
                          'Credit card debt at 26.9% annual interest',
                          'Borrowing from family or friends — stressful for relationships',
                          'Selling investments at a loss to raise cash quickly',
                        ],
                        tip: '$1,000 on a credit card at 26.9% costs $269 in interest if unpaid for a year.',
                      },
                      {
                        icon: '📉',
                        label: 'Knock-on damage',
                        sublabel: 'The crisis compounds',
                        color: '#4F46E5',
                        details: [
                          'Financial anxiety affects sleep and academic performance',
                          'Debt repayment disrupts your monthly budget for months',
                          'Positive saving habits you built get broken',
                        ],
                        tip: 'Research links financial stress directly to lower GPA and reduced concentration in students.',
                      },
                    ],
                  },
                  {
                    type: 'bullets',
                    title: 'The real cost of having no emergency fund:',
                    items: [
                      '💳 Credit card debt at 26.9% annual interest',
                      '🙏 Borrowing from family or friends — stressful for relationships',
                      '😰 Financial anxiety that affects sleep and academic performance',
                      '📉 Forced to sell investments at the wrong time to raise cash',
                      '🔄 Breaking a positive saving streak you worked hard to build',
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 How does financial stress affect student academic performance?',
                    prompt: 'financial stress impact student academic performance university research Singapore',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '3-1-s3-scenarios',
                    fincoins: 10,
                    title: 'Emergency Fund Decisions',
                    scenarios: [
                      {
                        icon: '💻',
                        situation: 'Your laptop dies two weeks before finals. Repair costs $400. You have no emergency fund. What do you do?',
                        options: [
                          {
                            text: 'Put it on your credit card and pay it back over 3 months.',
                            biasLabel: 'Costly but common',
                            biasExplanation: '$400 on a credit card at 26.9% p.a. over 3 months costs roughly $27 in interest on top. An emergency fund would have made this free.',
                            isIdeal: false,
                          },
                          {
                            text: 'Borrow from a friend and pay back next month.',
                            biasLabel: 'Relationship risk',
                            biasExplanation: 'Borrowing from friends for financial emergencies strains relationships — especially if repayment is delayed. It\'s a social cost on top of the financial one.',
                            isIdeal: false,
                          },
                          {
                            text: 'Use the emergency fund — this is exactly what it\'s for.',
                            biasLabel: 'Correct use ✓',
                            biasExplanation: 'A broken essential tool affecting your academic performance is a genuine emergency. Using the fund here is textbook correct — then rebuild it afterward.',
                            isIdeal: true,
                          },
                        ],
                      },
                      {
                        icon: '✈️',
                        situation: 'You haven\'t been home in a year and flights are cheap this weekend. You have $1,200 in your emergency fund. Do you use it?',
                        options: [
                          {
                            text: 'Yes — mental health is important and you miss home.',
                            biasLabel: 'Rationalisation',
                            biasExplanation: 'Emotional framing can make discretionary spending feel essential. A planned trip home is not a financial emergency — save separately for it.',
                            isIdeal: false,
                          },
                          {
                            text: 'Use half — $600 for the flight, keep $600 as a partial fund.',
                            biasLabel: 'Compromise trap',
                            biasExplanation: 'Half an emergency fund is much less useful than a full one. If a real crisis hits after, you\'re still exposed. Don\'t chip at it for non-emergencies.',
                            isIdeal: false,
                          },
                          {
                            text: 'Don\'t use it — save separately for the trip from your Wants budget.',
                            biasLabel: 'Correct boundary ✓',
                            biasExplanation: 'A trip home is a Want — save for it from your 30% Wants allocation. The emergency fund is untouchable for discretionary spending.',
                            isIdeal: true,
                          },
                        ],
                      },
                      {
                        icon: '🏥',
                        situation: 'You have a $600 emergency fund (half-built). An unexpected $400 medical bill arrives. Do you use the fund?',
                        options: [
                          {
                            text: 'No — keep the fund intact and put the bill on credit card.',
                            biasLabel: 'Wrong priority',
                            biasExplanation: 'Credit card interest (26.9% p.a.) is far more expensive than rebuilding your fund. Use the emergency fund — it\'s there for this — then rebuild.',
                            isIdeal: false,
                          },
                          {
                            text: 'Yes — use $400 from the fund, then prioritise rebuilding it.',
                            biasLabel: 'Correct use ✓',
                            biasExplanation: 'This is a genuine emergency. Using the fund saves you ~$27 in interest vs. credit card. Afterward, redirect savings contributions to rebuild it.',
                            isIdeal: true,
                          },
                          {
                            text: 'Ask family to pay — don\'t touch any savings.',
                            biasLabel: 'Dependency',
                            biasExplanation: 'The emergency fund exists precisely so you don\'t have to ask family in a crisis. Building financial independence means using your own buffer first.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Emergency Fund Fundamentals',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on what an emergency fund is, how much you need, and what happens when you don\'t have one.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — key emergency fund rules to remember?',
                    prompt: 'emergency fund key rules students Singapore summary how much where to keep',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '3-1-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Emergency Fund Fundamentals',
                    questions: [
                      {
                        concept: 'What qualifies as an emergency',
                        question: 'Which of these is the most valid use of an emergency fund?',
                        options: [
                          'A Shopee 11.11 sale on an item you\'ve wanted for months',
                          'Flights home that are unusually cheap this weekend',
                          'A sudden medical bill you have no other way to cover',
                          'A concert for your favourite artist — tickets sell out fast',
                        ],
                        correctIndex: 2,
                        explanation: 'An emergency fund is for genuine crises — unplanned, urgent, and financially damaging if unaddressed. Medical bills fit all three. Sales and concerts are discretionary Wants.',
                      },
                      {
                        concept: 'Fund size',
                        question: 'A student\'s monthly essentials are $1,200 (rent, food, transport, phone). What is their starter emergency fund target?',
                        options: [
                          '$1,200 — one month of expenses',
                          '$2,400 — two months of expenses',
                          '$3,600 — three months of expenses',
                          '$7,200 — six months of expenses',
                        ],
                        correctIndex: 2,
                        explanation: 'The starter fund is 3 months of essential expenses. $1,200 × 3 = $3,600. A full fund would be $7,200 — build toward that once the starter is in place.',
                      },
                      {
                        concept: 'No emergency fund consequences',
                        question: 'A student with no emergency fund faces a $1,000 crisis. They put it on a credit card at 26.9% p.a. and take 6 months to pay it off. What is the approximate interest cost?',
                        options: [
                          'Around $27',
                          'Around $67',
                          'Around $134',
                          'Nothing — credit cards are interest-free if paid within the month',
                        ],
                        correctIndex: 1,
                        explanation: '$1,000 at 26.9% over 6 months is roughly $67 in interest. An emergency fund would have made this cost zero — illustrating exactly why the fund pays for itself.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'How many months of expenses should an emergency fund cover?',
                a: '3 months minimum (starter fund), 6 months for a full fund.',
              },
              {
                q: 'What is a real emergency vs. a non-emergency?',
                a: 'Real: medical bill, job loss, broken essential item. Not real: sales, holidays, upgrades.',
              },
              {
                q: 'What happens if you have no emergency fund and face a crisis?',
                a: 'You go into high-interest credit card debt (26.9% p.a.) or have to borrow from family.',
              },
              {
                q: 'Where should you keep your emergency fund in Singapore?',
                a: 'In a high-yield savings account (OCBC 360, UOB One) or Singapore Savings Bond — accessible but separate from your daily account.',
              },
              {
                q: 'What is a starter emergency fund target for a Singapore student?',
                a: 'Around $3,000–$3,700 — 3 months of essential expenses (rent, food, transport, phone).',
              },
            ],
          },

          // ── LESSON 3-2 ──────────────────────────────
          {
            id: '3-2',
            title: 'How to Build Your Fund',
            icon: '🧱',
            topic: 'Strategies to build an emergency fund on a student budget',
            duration: '6 min',
            fincoins: 55,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'start',
                title: 'Starting From Zero',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Starting From Zero',
                  },
                  {
                    type: 'text',
                    text: 'Building an emergency fund on a student income feels daunting — but the goal is not to save $5,000 overnight. It\'s to make consistent, automatic, small deposits until the fund grows itself.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Saving just $100/month for 30 months builds a $3,000 emergency fund. That\'s $25/week — roughly skipping 4 bubble teas.',
                  },
                  {
                    type: 'subheading',
                    text: 'Your First Five Steps',
                  },
                  {
                    type: 'steps',
                    title: 'Starting from zero — step by step:',
                    steps: [
                      'Open a separate savings account (not your main account)',
                      'Set up an automatic transfer of $50–$100 on the day you receive income',
                      'Label the account "Emergency Fund — Do Not Touch"',
                      'Set milestones: celebrate (cheaply) when you hit $500, $1,000, $3,000',
                      'Never spend it unless it\'s a genuine emergency',
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: Most Singapore banks let you nickname your savings accounts in-app. Naming it "Emergency Fund" creates a psychological barrier — money with a label is harder to spend.',
                  },
                  {
                    type: 'bot',
                    label: '💬 How do I open a separate savings account in Singapore?',
                    prompt: 'open separate savings account Singapore student DBS OCBC UOB online 2025',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '3-2-s1-tinder',
                    fincoins: 10,
                    title: 'Starting Your Fund',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'You need a high income before you can start building an emergency fund.',
                        isTrue: false,
                        explanation: '$50–$100/month is enough to start. Consistency matters more than amount — small deposits compound over time.',
                      },
                      {
                        text: 'Saving $100/month builds a $3,000 emergency fund in 30 months.',
                        isTrue: true,
                        explanation: 'Simple math, but the key insight is that $100/month is only $25/week — achievable even on a student budget.',
                      },
                      {
                        text: 'Keeping your emergency fund in your main spending account is fine as long as you have self-discipline.',
                        isTrue: false,
                        explanation: 'Separation creates a psychological barrier. Money visible in your daily account gets spent — even with the best intentions. A separate account protects it.',
                      },
                      {
                        text: 'Setting up an automatic transfer on income day removes the decision entirely.',
                        isTrue: true,
                        explanation: 'Automation is the most reliable savings habit — it works without relying on willpower or remembering to transfer manually each month.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'strategies',
                title: 'Three Building Strategies',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Three Building Strategies',
                  },
                  {
                    type: 'text',
                    text: 'There are three proven strategies for building your emergency fund — each suits a different situation. The best approach is often a combination of all three.',
                  },
                  {
                    type: 'timeline',
                    title: 'Three building strategies:',
                    nodes: [
                      {
                        icon: '1️⃣',
                        label: 'Pay Yourself First',
                        sublabel: 'Most effective',
                        color: '#4F46E5',
                        examples: ['Salary day transfer', 'Auto-debit setup'],
                        details: [
                          'On income day, move your savings target immediately — before groceries, GrabFood, or anything else.',
                          'What\'s left after the transfer is yours to spend guilt-free.',
                          'Works because it removes the decision entirely — no willpower needed.',
                        ],
                        tip: 'Best for everyone. Set up an automatic transfer so it happens without you thinking about it.',
                      },
                      {
                        icon: '2️⃣',
                        label: 'Round-Up Savings',
                        sublabel: 'No willpower needed',
                        color: '#0891B2',
                        examples: ['Kopi at $4.60 → $0.40 saved', 'App-based rounding'],
                        details: [
                          'Apps round up every purchase to the nearest dollar and move the difference to savings automatically.',
                          'Small amounts compound faster than you think — no fixed commitment required.',
                          'Completely passive — works in the background while you spend normally.',
                        ],
                        tip: 'Best for low or irregular income — the amounts are tiny but add up meaningfully over months.',
                      },
                      {
                        icon: '3️⃣',
                        label: 'Windfall Saving',
                        sublabel: 'Accelerate your fund',
                        color: '#059669',
                        examples: ['Ang bao money', 'Part-time bonuses', 'Tax refunds'],
                        details: [
                          'Save 100% of unexpected money before it gets absorbed into daily spending.',
                          'One ang bao season alone can add $200–$500 to your emergency fund.',
                          'Best used alongside Strategy 1 — windfalls boost, but don\'t replace, regular saving.',
                        ],
                        tip: 'Transfer windfall money to your emergency fund within 24 hours — before you find something to spend it on.',
                      },
                    ],
                  },
                  {
                    type: 'subheading',
                    text: 'Combining the Strategies',
                  },
                  {
                    type: 'text',
                    text: 'These strategies aren\'t mutually exclusive. A student paying themselves first ($80/month) + rounding up purchases (~$20/month) + saving ang bao money ($300/year) reaches $3,000 in under 2 years.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Behavioural research shows that automatic savings transfers are 3× more likely to be maintained than manual ones — the moment you remove the decision, consistency follows.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Are there round-up savings apps available in Singapore?',
                    prompt: 'round-up automatic savings apps Singapore 2025 student micro-saving',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '3-2-s2-scenarios',
                    fincoins: 10,
                    title: 'Which strategy fits?',
                    scenarios: [
                      {
                        icon: '📅',
                        situation: 'You receive a fixed $1,200 allowance on the 1st of every month. You want to save consistently without thinking about it. Which strategy fits best?',
                        options: [
                          {
                            text: 'Pay yourself first — auto-transfer $150 the moment income arrives.',
                            biasLabel: 'Best fit ✓',
                            biasExplanation: 'Fixed income + automation = the most reliable combination. You never see the $150, so you never miss it.',
                            isIdeal: true,
                          },
                          {
                            text: 'Round-up savings — let the app accumulate micro-amounts.',
                            biasLabel: 'Too slow for this goal',
                            biasExplanation: 'Round-ups work well as a supplement but are too slow as a primary strategy on a fixed income. With $1,200/month you can do better.',
                            isIdeal: false,
                          },
                          {
                            text: 'Save whatever is left at month-end.',
                            biasLabel: 'Passive trap',
                            biasExplanation: 'Saving "what\'s left" almost always results in nothing left. Expenses expand to fill available money — plan first, spend after.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '🎍',
                        situation: 'It\'s Chinese New Year and you\'ve collected $450 in ang bao money. You have no emergency fund yet. What\'s the best move?',
                        options: [
                          {
                            text: 'Treat yourself — you only get ang bao season once a year.',
                            biasLabel: 'Windfall spending',
                            biasExplanation: 'Windfalls feel like "free money" and trigger spending. But $450 is almost 15% of a starter emergency fund — a huge one-off opportunity.',
                            isIdeal: false,
                          },
                          {
                            text: 'Transfer the full $450 to a savings account immediately.',
                            biasLabel: 'Best fit ✓',
                            biasExplanation: 'Saving windfall money before it gets absorbed is one of the fastest ways to kickstart your fund. $450 deposited now is a meaningful head start.',
                            isIdeal: true,
                          },
                          {
                            text: 'Split it — $200 to savings, $250 to spend.',
                            biasLabel: 'Reasonable compromise',
                            biasExplanation: 'Not wrong, but with no emergency fund yet, fully deploying a windfall is the stronger move. Treats can come from your monthly Wants budget.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '💸',
                        situation: 'Your income is inconsistent — some months $600 from part-time work, others $1,400. A fixed monthly transfer feels risky. What\'s the best approach?',
                        options: [
                          {
                            text: 'Skip saving until income stabilises.',
                            biasLabel: 'Indefinite delay',
                            biasExplanation: 'Irregular income is normal for students — waiting for stability means the fund never gets started. Small, variable amounts still compound over time.',
                            isIdeal: false,
                          },
                          {
                            text: 'Set a floor transfer ($50) every month + save 50% of any income above $800.',
                            biasLabel: 'Best fit ✓',
                            biasExplanation: 'A small floor amount ensures consistent progress on low-income months. Saving aggressively above a threshold accelerates the fund when income is higher.',
                            isIdeal: true,
                          },
                          {
                            text: 'Only use round-up savings — no fixed commitment.',
                            biasLabel: 'Too passive',
                            biasExplanation: 'Round-ups alone on an irregular income generate very small amounts. Combine with a minimum floor transfer for meaningful progress.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'where',
                title: 'Where to Keep It in Singapore',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Where to Keep It in Singapore',
                  },
                  {
                    type: 'text',
                    text: 'Where you keep your emergency fund matters — the right account earns you interest while keeping the money accessible. Tap each option to find the best fit for your situation.',
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
                        singaporeTip: 'DBS NAV Planner integrates directly with Multiplier — track both spending and savings interest in the same app.',
                      },
                      {
                        icon: '📜',
                        name: 'Singapore Savings Bond',
                        color: '#059669',
                        tagline: 'Government-backed, flexible, risk-free',
                        cost: 'Min. $500 to invest',
                        rating: 4.4,
                        keyFeature: 'Issued by the Singapore government — zero default risk. Step-up interest averaging ~3% p.a. over 10 years. Redeemable any month with no penalty.',
                        bestFor: 'Students with a lump sum ($500+) they won\'t need for at least a month. Not ideal for money you may need within days.',
                        singaporeTip: 'Apply via DBS/OCBC/UOB internet banking or ATM using your CDP account. New tranches issued monthly — check MAS website for current rates.',
                      },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: As a student without a salary, you may not qualify for bonus interest tiers on OCBC/UOB. Use a standard savings account or SSB until you start working — even 3% beats 0.05%.',
                  },
                  {
                    type: 'subheading',
                    text: 'Choosing the Right Account',
                  },
                  {
                    type: 'flipcards',
                    variant: 'neutral',
                    title: 'Which account fits your situation?',
                    cards: [
                      {
                        frontLabel: '👤 Situation',
                        backLabel: '✅ Best fit',
                        front: 'Student with no salary, just starting out. Want something simple.',
                        back: 'Open a UOB One or OCBC 360 account. Even the base rate beats a standard savings account. You\'ll unlock bonus tiers when you start working.',
                        tag: 'Early-stage student',
                      },
                      {
                        frontLabel: '👤 Situation',
                        backLabel: '✅ Best fit',
                        front: 'You have $1,000+ saved already and won\'t need it urgently.',
                        back: 'Move part of it into a Singapore Savings Bond (SSB) for 3%+ government-backed interest. Keep $300–$500 liquid in a savings account for instant access.',
                        tag: 'Fund partially built',
                      },
                      {
                        frontLabel: '👤 Situation',
                        backLabel: '✅ Best fit',
                        front: 'You have a part-time job and spend $500+/month on your UOB card.',
                        back: 'Qualify for UOB One bonus interest immediately — set up one GIRO debit (phone bill works) and you\'re in the high-interest tier.',
                        tag: 'Part-time worker',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Current OCBC 360 and UOB One interest rates',
                    prompt: 'OCBC 360 UOB One DBS Multiplier current interest rates Singapore 2025',
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Building Your Fund',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on how to start from zero, which strategy fits which situation, and where to keep your fund in Singapore.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — best strategies for building an emergency fund as a student?',
                    prompt: 'emergency fund building strategies students Singapore pay yourself first auto-transfer',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '3-2-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Building Your Fund',
                    questions: [
                      {
                        concept: 'Starting from zero',
                        question: 'What is the most important first step when building an emergency fund from scratch?',
                        options: [
                          'Wait until you have $500 saved before opening a separate account',
                          'Open a separate account and set up an automatic transfer on income day',
                          'Save whatever is left at the end of each month',
                          'Invest the money in a robo-advisor for better returns',
                        ],
                        correctIndex: 1,
                        explanation: 'Separation + automation is the foundation. A separate account protects the fund psychologically; automation removes the decision so it happens regardless of willpower.',
                      },
                      {
                        concept: 'Choosing a strategy',
                        question: 'A student receives an ang bao windfall of $600 and has no emergency fund yet. What is the best use of this money?',
                        options: [
                          'Spend it — windfalls are meant to be enjoyed',
                          'Invest it in stocks for better returns than a savings account',
                          'Transfer it directly to a new emergency fund savings account',
                          'Split equally between spending and a savings account',
                        ],
                        correctIndex: 2,
                        explanation: 'A windfall with no emergency fund is a rare opportunity to make a large one-off deposit. $600 is 20% of a starter fund in a single transfer — exactly what windfall saving is for.',
                      },
                      {
                        concept: 'Where to keep it',
                        question: 'A student with $800 in their emergency fund wants to earn better interest without losing access. What is the best option?',
                        options: [
                          'Leave it in a standard savings account at 0.05% — safest option',
                          'Move it into a Singapore Savings Bond — redeemable any month, ~3% p.a.',
                          'Put it in a fixed deposit — locked for 12 months for highest rate',
                          'Invest it in an index fund — higher long-term returns',
                        ],
                        correctIndex: 1,
                        explanation: 'The SSB offers government-backed returns of ~3% p.a. and can be redeemed any month with no penalty — ideal for emergency funds. Fixed deposits lock money up; index funds are too volatile for emergency reserves.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'What is the "pay yourself first" strategy?',
                a: 'Transfer your savings immediately when income arrives — before spending on anything else.',
              },
              {
                q: 'How long does it take to save $3,000 at $100/month?',
                a: '30 months — or faster if you save windfalls like ang bao money or part-time bonuses.',
              },
              {
                q: 'Which Singapore bank accounts offer the highest savings interest rates?',
                a: 'OCBC 360, UOB One, and DBS Multiplier — all offer 3–4.65% p.a. with qualifying conditions.',
              },
              {
                q: 'Why should your emergency fund be in a separate account?',
                a: 'To create a psychological barrier — money you can see in your daily account gets spent.',
              },
              {
                q: 'What is a round-up savings strategy?',
                a: 'Apps automatically round up each purchase to the nearest dollar and save the difference — effortless micro-saving.',
              },
            ],
          },         

          // ── LESSON 3-3 ──────────────────────────────
          // ── LESSON 3-3 ──────────────────────────────
          {
            id: '3-3',
            title: 'Saving for Goals Beyond Emergencies',
            icon: '🌟',
            topic: 'Goal-based saving and short vs long-term saving strategies',
            duration: '5 min',
            fincoins: 55,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'types',
                title: 'Short vs Long-Term Savings',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Short vs Long-Term Savings',
                  },
                  {
                    type: 'text',
                    text: 'Once your emergency fund is in place, the next step is saving intentionally for goals — whether that\'s a laptop in 3 months, a trip in 6 months, or a house in 10 years. Each goal deserves its own dedicated savings bucket.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Goal-Based Saving',
                    definition: 'The practice of assigning each savings pot a specific purpose and time horizon — so every dollar you save has a name, a target, and a deadline.',
                  },
                  {
                    type: 'subheading',
                    text: 'Time Horizon Determines Strategy',
                  },
                  {
                    type: 'text',
                    text: 'The single most important factor in choosing where to keep savings is how soon you\'ll need the money. The longer the horizon, the more risk you can afford — and the higher the potential return.',
                  },
                  {
                    type: 'timeline',
                    title: 'Time horizon → right account:',
                    nodes: [
                      {
                        icon: '⚡',
                        label: 'Short-term (< 1 year)',
                        sublabel: 'High-yield savings account',
                        color: '#4F46E5',
                        examples: ['Laptop', 'Holiday', 'Semester fees'],
                        details: [
                          'Keep it accessible and risk-free — you need this money soon',
                          'High-yield savings accounts are ideal: OCBC 360, UOB One, DBS Multiplier',
                          'Never invest money you\'ll need within 12 months — markets can drop 20% overnight',
                        ],
                        tip: 'Saving $600 for a Japan trip in 8 months? Keep it in OCBC 360 at ~4% p.a. — safe, accessible, and earning interest.',
                      },
                      {
                        icon: '📅',
                        label: 'Medium-term (1–5 years)',
                        sublabel: 'SSB or Fixed Deposit',
                        color: '#F59E0B',
                        examples: ['Postgrad fees', 'Car', 'Wedding fund'],
                        details: [
                          'You can afford slightly less liquidity in exchange for better returns',
                          'Singapore Savings Bonds — government-backed, redeemable monthly, ~3% p.a.',
                          'Fixed deposits — lock in a rate for 6–24 months, typically 3–3.5% p.a.',
                        ],
                        tip: 'SSB gives you ~3% p.a. with full capital protection and monthly redemption flexibility if your plans change.',
                      },
                      {
                        icon: '🌱',
                        label: 'Long-term (5+ years)',
                        sublabel: 'Investments',
                        color: '#059669',
                        examples: ['House downpayment', 'Retirement', 'Financial freedom'],
                        details: [
                          'Long time horizons absorb market volatility — invest for significantly higher returns',
                          'STI ETF or global index funds (e.g. VWRA) for DIY investors',
                          'Robo-advisors like Syfe or StashAway for hands-off investing with low minimums',
                          'Time in the market consistently beats timing the market',
                        ],
                        tip: '$100/month invested from age 22 at 7% p.a. grows to ~$240,000 by age 62. The same amount in savings: ~$55,000.',
                      },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'warning',
                    text: 'Never invest money you\'ll need within 12 months. Markets can drop 20–30% in weeks — a short-term goal can be wiped out before you have time to recover.',
                  },
                  {
                    type: 'bot',
                    label: '💬 What are the current fixed deposit rates in Singapore?',
                    prompt: 'fixed deposit rates Singapore banks 2025 best rates DBS OCBC UOB',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '3-3-s1-tinder',
                    fincoins: 10,
                    title: 'Savings Horizon — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'Money needed in 8 months should be invested in an ETF for better returns.',
                        isTrue: false,
                        explanation: 'Short-term money (< 1 year) should never be invested. Markets can drop 20–30% quickly — a high-yield savings account is the right home for near-term goals.',
                      },
                      {
                        text: 'A Singapore Savings Bond is a suitable account for a 3-year savings goal.',
                        isTrue: true,
                        explanation: 'SSBs offer ~3% p.a. with government backing and monthly redemption — ideal for medium-term goals where you want better returns but may need flexibility.',
                      },
                      {
                        text: 'The longer your savings horizon, the more risk you can afford to take.',
                        isTrue: true,
                        explanation: 'A longer timeline gives markets time to recover from dips. This is why retirement savings — decades away — are typically invested, not kept in savings accounts.',
                      },
                      {
                        text: 'Keeping all your savings in one account is more efficient than splitting by goal.',
                        isTrue: false,
                        explanation: 'Mixing goals in one account makes it impossible to track progress and easy to accidentally spend one goal\'s savings on another. Separate buckets prevent this.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'buckets',
                title: 'The Multiple Savings Buckets Approach',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'The Multiple Savings Buckets Approach',
                  },
                  {
                    type: 'text',
                    text: 'The most effective savings system gives every goal its own named bucket — a separate account or sub-account with a specific target and deadline. Tap each bucket below to see how it works.',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '🛡️',
                        label: 'Bucket 1 — Emergency Fund',
                        description: '3–6 months of expenses. Fill this first before all other buckets.',
                        color: '#DC2626',
                        details: [
                          'This is your financial safety net — non-negotiable foundation',
                          'Target: 3 months expenses minimum, 6 months ideal',
                          'Keep it in a high-yield savings account, not investments',
                          'Only use it for genuine emergencies: job loss, medical, urgent repairs',
                          'Once full, redirect monthly contributions to Bucket 2 or 3',
                        ],
                        example: 'Monthly essentials of $1,200 → starter target of $3,600. Contribute $150/month → full in 24 months.',
                      },
                      {
                        icon: '🎯',
                        label: 'Bucket 2 — Goal Fund',
                        description: 'Named after a specific goal — e.g. "Japan 2025" or "MacBook Fund".',
                        color: '#4F46E5',
                        details: [
                          'One account (or sub-account) per goal — name it after the goal',
                          'Calculate: total needed ÷ months remaining = monthly transfer amount',
                          'OCBC Savings Pockets or separate sub-accounts work perfectly',
                          'Short-term goals: savings account. Medium-term: SSB or fixed deposit',
                        ],
                        example: 'Japan trip costs $1,800 in 9 months → save $200/month, name the account "Japan 2025".',
                      },
                      {
                        icon: '📈',
                        label: 'Bucket 3 — Investment Fund',
                        description: 'Long-term wealth building — only money you won\'t need for 5+ years.',
                        color: '#059669',
                        details: [
                          'Start with a robo-advisor (Syfe, StashAway) — low minimums, auto-diversified',
                          'STI ETF or global index funds (e.g. VWRA) for DIY investors',
                          'Even $50/month at 7% p.a. from age 22 grows to ~$150,000 by retirement',
                          'Time in the market beats timing the market — start small, start now',
                        ],
                        example: '$100/month into Syfe Core Equity100 from age 22 → ~$240,000 by age 62 at historical 7% p.a.',
                      },
                      {
                        icon: '🎉',
                        label: 'Bucket 4 — Fun Fund',
                        description: 'Guilt-free spending money — optional but surprisingly powerful.',
                        color: '#F59E0B',
                        details: [
                          'A dedicated fun budget removes guilt from enjoying your money',
                          'When it\'s empty, you stop — no guilt, no overspending, no shame',
                          'Typically 10–15% of your monthly Wants budget set aside separately',
                          'Use it for concerts, spontaneous trips, treats, gifts',
                        ],
                        example: 'Set aside $100/month labelled "Fun Fund". Spend it freely — when it\'s gone, it\'s gone until next month.',
                      },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Naming a savings account after a goal increases the likelihood of reaching it by 31% — behavioural economics research consistently shows that named money is harder to spend.',
                  },
                  {
                    type: 'subheading',
                    text: 'Setting Up a Goal Account — Step by Step',
                  },
                  {
                    type: 'steps',
                    title: 'Setting up a goal-based savings account:',
                    steps: [
                      'Open a sub-account or separate account (most Singapore banks allow this free)',
                      'Name it after your goal — "Japan 2025" or "MacBook Fund"',
                      'Calculate how much you need and by when',
                      'Divide the total by months remaining — that is your monthly transfer amount',
                      'Set up an automatic transfer for that amount on income day',
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: OCBC allows you to create multiple savings "pockets" within one account — each named separately. It\'s free, instant, and perfect for the buckets approach.',
                  },
                  {
                    type: 'bot',
                    label: '💬 How do I set up savings pockets in OCBC Singapore?',
                    prompt: 'OCBC savings pockets how to set up sub accounts Singapore 2025',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '3-3-s2-scenarios',
                    fincoins: 10,
                    title: 'Which bucket does it belong in?',
                    scenarios: [
                      {
                        icon: '💻',
                        situation: 'You need a new laptop for your final year project — $1,500, needed in 7 months. You have $800 in emergency fund and $200 saved loosely.',
                        options: [
                          {
                            text: 'Use your emergency fund — laptops are essential.',
                            biasLabel: 'Wrong bucket',
                            biasExplanation: 'A planned purchase is not an emergency. Using the emergency fund for something predictable leaves you exposed when a real crisis hits. Open a separate Goal Fund.',
                            isIdeal: false,
                          },
                          {
                            text: 'Open a "Laptop Fund" account, save $215/month for 7 months.',
                            biasLabel: 'Correct bucket ✓',
                            biasExplanation: '$1,500 ÷ 7 months = $215/month. A named Goal Fund keeps this separate from both your emergency fund and daily spending — the right tool for a planned goal.',
                            isIdeal: true,
                          },
                          {
                            text: 'Invest $200 in an ETF — 7 months might be enough for returns.',
                            biasLabel: 'Wrong horizon',
                            biasExplanation: '7 months is too short to invest. Markets can drop 20–30% — you could end up with $140 when you need $1,500. Short-term goals belong in savings accounts.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '🏠',
                        situation: 'You want to save for a house downpayment — estimated $80,000 needed in about 8–10 years. Where should this money go?',
                        options: [
                          {
                            text: 'High-yield savings account — safe and accessible.',
                            biasLabel: 'Too conservative',
                            biasExplanation: 'At 3% p.a. for 10 years, $500/month grows to ~$70,000. At 7% p.a. (investing), the same $500/month grows to ~$87,000. Long horizons reward investment risk.',
                            isIdeal: false,
                          },
                          {
                            text: 'Invest in a robo-advisor or index fund — 8–10 year horizon absorbs volatility.',
                            biasLabel: 'Correct bucket ✓',
                            biasExplanation: 'An 8–10 year horizon is firmly long-term. Investing in a diversified fund gives you significantly higher expected returns than savings accounts — time absorbs the risk.',
                            isIdeal: true,
                          },
                          {
                            text: 'Singapore Savings Bond — government-backed and safe.',
                            biasLabel: 'Suboptimal return',
                            biasExplanation: 'SSB is excellent for medium-term (1–5 years), but at ~3% p.a. it significantly underperforms a diversified index fund over 8–10 years. Too conservative for this horizon.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '🎉',
                        situation: 'You\'ve been impulsively buying things and feeling guilty about it. You want to enjoy spending without the guilt. What\'s the smartest move?',
                        options: [
                          {
                            text: 'Cut all discretionary spending — save everything you can.',
                            biasLabel: 'Unsustainable',
                            biasExplanation: 'Total restriction leads to rebound spending. A sustainable budget includes intentional fun money — the goal is balance, not deprivation.',
                            isIdeal: false,
                          },
                          {
                            text: 'Set up a monthly Fun Fund — spend it freely, guilt-free, until it\'s empty.',
                            biasLabel: 'Correct bucket ✓',
                            biasExplanation: 'A Fun Fund gives you permission to spend within a defined limit. When it\'s gone, you stop — no guilt, no shame. Paradoxically, it reduces overall impulsive spending.',
                            isIdeal: true,
                          },
                          {
                            text: 'Keep spending as you are — budgets are too restrictive.',
                            biasLabel: 'No system',
                            biasExplanation: 'Without a system, impulsive spending continues and guilt compounds. A Fun Fund solves both problems — it gives structure to enjoyment.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'tools',
                title: 'Tools for Goal-Based Saving in Singapore',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Tools for Goal-Based Saving in Singapore',
                  },
                  {
                    type: 'text',
                    text: 'Singapore\'s banking ecosystem makes goal-based saving easy — most major banks offer free sub-accounts or savings pockets. Here\'s what each platform offers and which goal type it suits.',
                  },
                  {
                    type: 'subheading',
                    text: 'Bank Features for Goal Saving',
                  },
                  {
                    type: 'flipcards',
                    variant: 'neutral',
                    title: 'Platform → goal saving feature',
                    cards: [
                      {
                        frontLabel: '🏦 Platform',
                        backLabel: '✅ Feature',
                        front: 'OCBC Bank',
                        back: 'OCBC Savings Pockets — create multiple named sub-accounts within one account. Free, instant setup in-app. Each pocket earns interest separately.',
                        tag: 'Best for multiple short-term goals',
                      },
                      {
                        frontLabel: '🏦 Platform',
                        backLabel: '✅ Feature',
                        front: 'DBS Bank',
                        back: 'DBS NAV Planner lets you set savings goals with visual progress tracking. Multiple Multiplier sub-accounts can be created for different goals.',
                        tag: 'Best for DBS users wanting visual goal tracking',
                      },
                      {
                        frontLabel: '🏦 Platform',
                        backLabel: '✅ Feature',
                        front: 'Syfe (Robo-advisor)',
                        back: 'Syfe Goals lets you create named investment portfolios for each long-term goal. No minimum, auto-rebalanced, and tracks goal progress as a percentage.',
                        tag: 'Best for long-term investment goals',
                      },
                      {
                        frontLabel: '🏦 Platform',
                        backLabel: '✅ Feature',
                        front: 'Singapore Savings Bond',
                        back: 'Apply monthly via DBS/OCBC/UOB for government-backed returns of ~3% p.a. Redeemable any month — perfect for medium-term goals with flexibility needs.',
                        tag: 'Best for medium-term goals (1–5 years)',
                      },
                    ],
                  },
                  {
                    type: 'subheading',
                    text: 'Quick Reference — Goal to Account',
                  },
                  {
                    type: 'table',
                    headers: ['Goal Type', 'Horizon', 'Best Account'],
                    rows: [
                      ['Holiday / laptop / fees', '< 1 year', 'OCBC 360 Pocket'],
                      ['Postgrad / wedding fund', '1–5 years', 'SSB or Fixed Deposit'],
                      ['House / retirement', '5+ years', 'Syfe / STI ETF'],
                      ['Emergency buffer', 'Always liquid', 'UOB One / OCBC 360'],
                    ],
                  },
                  {
                    type: 'mcq',
                    exerciseId: '3-3-s3-mcq',
                    fincoins: 10,
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
                    explanation: 'Short-term goals (< 1 year) need accessible, low-risk accounts. STI ETF is too volatile for 8 months. CPF locks money in. Daily accounts earn near-zero interest. OCBC 360 is safe, accessible, and earns ~4% p.a.',
                  },
                  {
                    type: 'bot',
                    label: '💬 How do I apply for a Singapore Savings Bond?',
                    prompt: 'how to apply Singapore Savings Bond SSB DBS OCBC UOB steps 2025',
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Saving for Goals',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on time horizons, the savings buckets system, and the right tools for goal-based saving in Singapore.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — key rules for goal-based saving in Singapore?',
                    prompt: 'goal based saving key rules Singapore students short medium long term accounts',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '3-3-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Saving for Goals',
                    questions: [
                      {
                        concept: 'Savings time horizons',
                        question: 'A student wants to save $2,400 for a Japan trip happening in 10 months. Which approach is correct?',
                        options: [
                          'Invest in a robo-advisor — 10 months is enough time for returns',
                          'Put it in a fixed deposit — higher rate than a savings account',
                          'Keep it in a high-yield savings account — accessible and risk-free',
                          'Use CPF top-ups for the tax relief benefit',
                        ],
                        correctIndex: 2,
                        explanation: 'Short-term goals (< 1 year) need accessible, low-risk accounts. Robo-advisors can drop in value; fixed deposits may have lock-in periods; CPF is for retirement. A high-yield savings account is risk-free and accessible.',
                      },
                      {
                        concept: 'The buckets approach',
                        question: 'A student has $3,600 in a single savings account covering emergency fund, Japan trip savings, and fun money. What is the main problem?',
                        options: [
                          'The total amount is too low to be split across multiple accounts',
                          'All goals mixed together makes it impossible to track progress and easy to accidentally overspend one goal',
                          'A single account earns more interest than multiple sub-accounts',
                          'There is no problem — one account is simpler and equally effective',
                        ],
                        correctIndex: 1,
                        explanation: 'Mixing goals in one account removes clarity and accountability. You can\'t tell how close you are to each goal, and spending bleeds across categories. Named separate buckets solve both problems.',
                      },
                      {
                        concept: 'Singapore tools',
                        question: 'A student wants to save for a postgrad degree costing $20,000 — needed in 3 years. Which account is most appropriate?',
                        options: [
                          'Daily spending account — easy access',
                          'STI ETF — highest long-term returns',
                          'Singapore Savings Bond — ~3% p.a., government-backed, redeemable monthly',
                          'Robo-advisor — auto-diversified and low minimum',
                        ],
                        correctIndex: 2,
                        explanation: 'Three years is medium-term — SSBs offer ~3% p.a. with zero default risk and monthly redemption if plans change. An ETF or robo-advisor carries market risk inappropriate for a goal needed in 3 years.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'What is the multiple savings buckets approach?',
                a: 'Separate savings pots for different goals: Emergency Fund, Specific Goals, Investments, and Fun Money.',
              },
              {
                q: 'What account type is best for a short-term goal (< 1 year)?',
                a: 'A high-yield savings account — accessible, earns decent interest, no lock-in period.',
              },
              {
                q: 'What account type is best for a 3-year savings goal?',
                a: 'Fixed deposit or Singapore Savings Bond — slightly higher rates, some lock-in acceptable.',
              },
              {
                q: 'How does naming a savings account affect your saving behaviour?',
                a: 'It increases goal achievement by 31% — naming creates a psychological commitment to the goal.',
              },
              {
                q: 'How do you calculate a monthly savings target for a goal?',
                a: 'Total amount needed ÷ number of months remaining = monthly transfer amount.',
              },
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
            // ── LESSON 4-1 ──────────────────────────────
            {
              id: '4-1',
              title: 'The Big Three Local Banks',
              icon: '🏛️',
              topic: 'DBS OCBC UOB Singapore banking overview',
              duration: '6 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'overview',
                  title: 'DBS, OCBC & UOB Overview',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'DBS, OCBC & UOB Overview',
                    },
                    {
                      type: 'text',
                      text: 'Singapore has three local banks that dominate its financial system — DBS, OCBC, and UOB. All three are SGX-listed, regulated by the Monetary Authority of Singapore (MAS), and your deposits are protected up to $75,000 per bank by the Singapore Deposit Insurance Corporation (SDIC).',
                    },
                    {
                      type: 'keyterm',
                      term: 'SDIC (Singapore Deposit Insurance Corporation)',
                      definition: 'A government-backed scheme that protects deposits up to $75,000 per depositor per bank — so your savings are safe even in the unlikely event a bank fails.',
                    },
                    {
                      type: 'callout',
                      variant: 'fact',
                      text: 'Singapore\'s Big Three are consistently ranked among the safest banks in Asia and the world — DBS has been named World\'s Best Bank multiple times by Global Finance magazine.',
                    },
                    {
                      type: 'subheading',
                      text: 'Meet the Big Three',
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
                          sublabel: 'Largest bank in SEA',
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
                            'UOB TMRW app aimed at younger users with a strong credit card rewards ecosystem.',
                          ],
                          tip: 'Best for: students who already spend consistently each month and want to earn interest on that spending.',
                        },
                      ],
                    },
                    {
                      type: 'bot',
                      label: '💬 Current student account opening requirements for DBS, OCBC and UOB',
                      prompt: 'student account opening requirements welcome offers DBS OCBC UOB Singapore 2025',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '4-1-s1-tinder',
                      fincoins: 10,
                      title: 'Bank Knowledge Check',
                      instruction: 'Swipe right for True · Swipe left for False',
                      statements: [
                        {
                          text: 'All three local banks are regulated by MAS.',
                          isTrue: true,
                          explanation: 'DBS, OCBC, and UOB are all licensed and regulated by MAS — Singapore\'s central bank and financial regulator.',
                        },
                        {
                          text: 'SDIC protects your deposits up to $75,000 per bank.',
                          isTrue: true,
                          explanation: 'The Singapore Deposit Insurance Corporation insures up to $75,000 per depositor per bank — so your money is safe even if a bank fails.',
                        },
                        {
                          text: 'DBS has the largest ATM network in Singapore.',
                          isTrue: true,
                          explanation: 'DBS/POSB has the most extensive ATM and branch network in Singapore, including on most university campuses.',
                        },
                        {
                          text: 'You need SingPass to open a bank account as an international student.',
                          isTrue: false,
                          explanation: 'As an international student, you can open an account with your passport and student pass — SingPass is helpful but not always required.',
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'accounts',
                  title: 'Account Types',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Account Types',
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
                      text: 'As an international student, a Savings Account is your starting point. If you regularly send money home or receive funds from overseas, ask about a Multi-Currency Account — it can save you significantly on FX conversion fees.',
                    },
                    {
                      type: 'subheading',
                      text: 'High-Yield Savings Accounts Explained',
                    },
                    {
                      type: 'text',
                      text: 'Each of the Big Three has a flagship high-yield savings account. These pay significantly more interest than standard accounts — but come with conditions you need to meet monthly.',
                    },
                    {
                      type: 'flipcards',
                      variant: 'neutral',
                      title: 'High-yield accounts — what are the conditions?',
                      cards: [
                        {
                          frontLabel: '🔴 DBS',
                          backLabel: '📋 Conditions',
                          front: 'DBS Multiplier — up to 4.1% p.a.',
                          back: 'Earn bonus interest by crediting salary + transacting across categories (credit card, insurance, investments). Interest scales with how many DBS products you use.',
                          tag: 'Best once you start working',
                        },
                        {
                          frontLabel: '🟠 OCBC',
                          backLabel: '📋 Conditions',
                          front: 'OCBC 360 — up to 4.65% p.a.',
                          back: 'Earn bonus tiers by crediting salary, spending on OCBC card, and holding insurance or investments. Includes free Savings Pockets for goal-based saving.',
                          tag: 'Best for goal-based savers',
                        },
                        {
                          frontLabel: '🔵 UOB',
                          backLabel: '📋 Conditions',
                          front: 'UOB One — up to 4% p.a.',
                          back: 'Simplest conditions: spend $500/month on UOB card + set up one GIRO debit. Your phone bill or MRT top-up GIRO counts — easy to qualify as a student.',
                          tag: 'Easiest to qualify for as a student',
                        },
                      ],
                    },
                    {
                      type: 'slider',
                      icon: '🏦',
                      title: 'Interest Earnings Comparison',
                      description: 'Drag to your savings amount and see what each account earns you per year.',
                      min: 500,
                      max: 10000,
                      step: 100,
                      initialValue: 2000,
                      prefix: '$',
                      calculateResult: (amount) => [
                        { label: '🔴 DBS Multiplier (base 0.05%)', value: `$${(amount * 0.0005).toFixed(2)}/yr`, color: '#DC2626' },
                        { label: '🟠 OCBC 360 (base 0.05%)', value: `$${(amount * 0.0005).toFixed(2)}/yr`, color: '#EA580C' },
                        { label: '🔵 UOB One (with $500 spend + GIRO)', value: `$${(amount * 0.04).toFixed(2)}/yr`, color: '#1D4ED8' },
                        { label: '🟢 GXS / Trust (base ~3%)', value: `$${(amount * 0.03).toFixed(2)}/yr`, color: '#059669' },
                      ],
                    },
                    {
                      type: 'callout',
                      variant: 'warning',
                      text: 'As a student without a salary, you may not hit the bonus interest tiers on DBS or OCBC. UOB One is often the easiest to qualify for — $500/month card spend and one GIRO debit is achievable on a student budget.',
                    },
                    {
                      type: 'bot',
                      label: '💬 What are the current interest rates for DBS Multiplier, OCBC 360 and UOB One?',
                      prompt: 'DBS Multiplier OCBC 360 UOB One current interest rates conditions 2025',
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'choose',
                  title: 'Which Bank Should You Choose?',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Which Bank Should You Choose?',
                    },
                    {
                      type: 'text',
                      text: 'There is no single "best" bank — the right choice depends on how you use your account. Here are the most common student scenarios and which bank fits each one best.',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '4-1-s3-scenarios',
                      fincoins: 10,
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
                              biasLabel: 'Good but fewer ATMs',
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
                          situation: 'You want to set up multiple savings goals (holiday fund, laptop fund, emergency fund) in separate named pockets.',
                          options: [
                            {
                              text: 'UOB One',
                              biasLabel: 'No pockets feature',
                              biasExplanation: 'UOB One is excellent for interest but doesn\'t offer goal-based savings pockets.',
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
                          situation: 'You send money home to family every month and want to minimise transfer fees.',
                          options: [
                            {
                              text: 'DBS Remit',
                              biasLabel: 'Best bank option ✓',
                              biasExplanation: 'DBS Remit offers zero-fee transfers to many countries with competitive exchange rates — the best option among the three local banks for overseas remittances.',
                              isIdeal: true,
                            },
                            {
                              text: 'Standard OCBC or UOB international transfer',
                              biasLabel: 'Higher fees',
                              biasExplanation: 'Standard international transfers through OCBC or UOB typically incur higher fees and less competitive FX rates than DBS Remit.',
                              isIdeal: false,
                            },
                            {
                              text: 'ATM cash withdrawal and manual overseas transfer',
                              biasLabel: 'Most expensive option',
                              biasExplanation: 'Withdrawing cash and transferring manually incurs the highest fees and worst exchange rates of any option.',
                              isIdeal: false,
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'Quick Reference — Bank to Use Case',
                    },
                    {
                      type: 'table',
                      headers: ['Priority', 'Best Bank'],
                      rows: [
                        ['Best app + most ATMs', 'DBS (digibank)'],
                        ['Goal-based savings pockets', 'OCBC (360 Pockets)'],
                        ['Easiest interest to qualify for', 'UOB (One Account)'],
                        ['Sending money home', 'DBS (DBS Remit)'],
                        ['Multi-currency / FX needs', 'DBS or OCBC'],
                      ],
                      firstColAccent: true,
                    },
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: There\'s no rule against having accounts at more than one bank. Many students use DBS as their daily account for ATM access, and OCBC 360 for savings pockets — the best of both.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Can international students open a bank account online in Singapore?',
                      prompt: 'international student open bank account online Singapore DBS OCBC UOB requirements 2025',
                    },
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: The Big Three Local Banks',
                    },
                    {
                      type: 'text',
                      text: 'Three questions covering Singapore\'s banking landscape, account types, and choosing the right bank for your situation.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — key facts about Singapore\'s Big Three banks?',
                      prompt: 'DBS OCBC UOB Singapore key differences student banking summary 2025',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '4-1-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'The Big Three Local Banks',
                      questions: [
                        {
                          concept: 'Deposit protection',
                          question: 'A student has $90,000 split across two banks — $60,000 in DBS and $30,000 in OCBC. How much is protected by SDIC?',
                          options: [
                            '$75,000 total — SDIC covers across all banks combined',
                            '$60,000 — only the DBS portion is under the limit',
                            '$90,000 — the full amount is protected',
                            '$75,000 in DBS and $30,000 in OCBC — $105,000 total protected',
                          ],
                          correctIndex: 3,
                          explanation: 'SDIC protects up to $75,000 per depositor per bank. DBS holds $60,000 (fully protected), OCBC holds $30,000 (fully protected). Total protected: $90,000 — the full amount.',
                        },
                        {
                          concept: 'Account types',
                          question: 'An international student receives money from overseas parents monthly and wants to avoid FX fees. Which account type should they ask about?',
                          options: [
                            'Current Account — designed for high transaction volume',
                            'Fixed Deposit — best interest rate available',
                            'Multi-Currency Account — holds and transacts in foreign currencies',
                            'Savings Account — standard starting point for all students',
                          ],
                          correctIndex: 2,
                          explanation: 'A Multi-Currency Account lets you receive, hold, and send money in foreign currencies without converting every time — significantly reducing FX fees for students who regularly transact internationally.',
                        },
                        {
                          concept: 'Choosing the right bank',
                          question: 'A student spends $600/month on their UOB card and has a phone bill on GIRO. Which account should they prioritise to earn the most interest on savings?',
                          options: [
                            'OCBC 360 — highest headline rate at 4.65% p.a.',
                            'DBS Multiplier — best for salary credit and multi-product use',
                            'UOB One — $500/month card spend + one GIRO qualifies for bonus interest',
                            'Standard savings account — simplest option with no conditions',
                          ],
                          correctIndex: 2,
                          explanation: 'UOB One has the simplest qualifying conditions — $500/month card spend and one GIRO debit. This student already meets both criteria, making UOB One the easiest path to bonus interest.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'What are Singapore\'s three local banks?',
                  a: 'DBS, OCBC, and UOB — all SGX-listed and regulated by MAS.',
                },
                {
                  q: 'How much does SDIC protect per depositor per bank?',
                  a: 'Up to $75,000 — so your savings are safe even if a bank fails.',
                },
                {
                  q: 'What is the difference between a savings account and a current account?',
                  a: 'Savings accounts earn interest (0.05%–7.65%); current accounts earn 0% but support high-volume transactions and cheques.',
                },
                {
                  q: 'Which local bank has the best digital app and widest ATM network?',
                  a: 'DBS — its digibank app is consistently rated top in Singapore, and it has the most ATMs island-wide.',
                },
                {
                  q: 'What account type is best for international students sending money home?',
                  a: 'A Multi-Currency Account or DBS Remit — both reduce FX conversion fees on overseas transfers.',
                },
              ],
            },

            // ── LESSON 4-2 ──────────────────────────────
            {
              id: '4-2',
              title: 'Digital Banks & Fintech',
              icon: '📱',
              topic: 'Singapore digital banks GXS Trust MariBank',
              duration: '5 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'digital',
                  title: 'Digital Banks in Singapore',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Digital Banks in Singapore',
                    },
                    {
                      type: 'text',
                      text: 'Singapore\'s banking landscape changed in 2022 when the Monetary Authority of Singapore (MAS) granted digital full bank licences to a new wave of challengers. These digital banks have no physical branches — everything happens on your phone.',
                    },
                    {
                      type: 'keyterm',
                      term: 'Digital Full Bank',
                      definition: 'A MAS-licensed bank that operates entirely online with no physical branches — offering savings accounts, loans, and payments through a mobile app, with the same deposit protection as traditional banks.',
                    },
                    {
                      type: 'callout',
                      variant: 'fact',
                      text: 'MAS granted 4 digital bank licences in 2020 — the first new bank licences in Singapore in over 20 years. GXS, Trust, and MariBank all launched between 2022 and 2023.',
                    },
                    {
                      type: 'subheading',
                      text: 'Meet Singapore\'s Three Digital Banks',
                    },
                    {
                      type: 'text',
                      text: 'Each digital bank is backed by a major tech or retail ecosystem — which shapes who it\'s built for and what it does best.',
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
                          examples: ['No minimum balance', 'FairPrice rewards', 'Up to 2.5% p.a.'],
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
                      type: 'bot',
                      label: '💬 Current interest rates for GXS, Trust, and MariBank savings accounts',
                      prompt: 'current savings account interest rates GXS Bank Trust Bank MariBank Singapore 2025',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '4-2-s1-tinder',
                      fincoins: 10,
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
                          text: 'MariBank is backed by Sea Limited, the parent company of Shopee.',
                          isTrue: true,
                          explanation: 'MariBank is Sea Limited\'s digital banking arm — leveraging the Shopee and SeaMoney ecosystem to reach its existing user base.',
                        },
                        {
                          text: 'Trust Bank charges a fall-below fee if your balance drops below $1,000.',
                          isTrue: false,
                          explanation: 'Trust Bank has no minimum balance requirement and no fall-below fees — one of its key advantages over traditional banks.',
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'compare',
                  title: 'Digital vs Traditional',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Digital vs Traditional',
                    },
                    {
                      type: 'text',
                      text: 'Digital banks and traditional banks serve different purposes. Neither is strictly better — knowing the trade-offs is what lets you use both strategically.',
                    },
                    {
                      type: 'table',
                      headers: ['Feature', 'Digital Banks', 'Traditional Banks'],
                      rows: [
                        ['Branches & ATMs', 'None — fully app-based', 'Island-wide network'],
                        ['Minimum balance', 'Usually $0', '$0–$3,000 depending on account'],
                        ['Fall-below fees', 'None', 'Up to $5/month if below minimum'],
                        ['Base interest rates', 'Competitive (2–3%+)', 'Low (~0.05%) without bonuses'],
                        ['Bonus interest', 'Simpler conditions', 'Higher ceiling with salary/spend bonuses'],
                        ['Overseas transfers', 'Limited or via partners', 'DBS Remit, OCBC, UOB transfer'],
                        ['Student credit', 'GXS FlexiLoan (no history needed)', 'Requires formal credit history'],
                        ['SDIC protected', '✅ Yes — up to $75,000', '✅ Yes — up to $75,000'],
                      ],
                    },
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: Digital banks are SDIC-insured just like traditional banks — your deposits up to $75,000 are equally protected. The difference is convenience and fee structure, not safety.',
                    },
                    {
                      type: 'subheading',
                      text: 'Where Each Type Wins',
                    },
                    {
                      type: 'topiccards',
                      cards: [
                        {
                          icon: '📱',
                          label: 'Digital Banks Win',
                          description: 'Lower friction, fewer fees, competitive base rates with no conditions.',
                          color: '#059669',
                          details: [
                            'No minimum balance or fall-below fees — ideal for students with variable income',
                            'Competitive base interest rates without needing salary credit',
                            'GXS FlexiLoan gives credit access without a formal credit history',
                            'Seamless integration with ecosystems you already use (Grab, Shopee, FairPrice)',
                          ],
                          example: 'A student with $800 in savings earns ~$24/year at Trust Bank\'s 3% base rate vs $0.40 in a standard savings account at 0.05%.',
                        },
                        {
                          icon: '🏦',
                          label: 'Traditional Banks Win',
                          description: 'Higher interest ceilings, ATM access, overseas transfers, and full product range.',
                          color: '#4F46E5',
                          details: [
                            'Island-wide ATM network — essential when you need cash',
                            'Higher bonus interest tiers (up to 4.65%) when you meet salary/spend conditions',
                            'Better overseas remittance options (DBS Remit — zero fees to many countries)',
                            'Full product ecosystem: credit cards, loans, investments, insurance',
                          ],
                          example: 'A student crediting salary to OCBC 360 and spending $500/month on the card can earn 4%+ — significantly higher than any digital bank.',
                        },
                      ],
                    },
                    {
                      type: 'bot',
                      label: '💬 How do digital banks in Singapore compare to traditional banks for students?',
                      prompt: 'digital banks vs traditional banks Singapore students comparison GXS Trust MariBank 2025',
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'pick',
                  title: 'When to Use Each',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'When to Use Each',
                    },
                    {
                      type: 'text',
                      text: 'The smartest strategy isn\'t choosing one over the other — it\'s using both. A traditional bank handles your primary transactions; a digital bank makes your idle savings work harder.',
                    },
                    {
                      type: 'flipcards',
                      variant: 'reframe',
                      title: 'Common mistakes → smarter approach',
                      cards: [
                        {
                          frontLabel: '❌ Common mistake',
                          backLabel: '✅ Smarter approach',
                          front: 'Putting all your money in one bank and hoping for the best interest rate.',
                          back: 'Use a traditional bank for your primary account (salary, bills, ATM access) and a digital bank for a high-yield savings pot earning 2–3%+.',
                          tag: 'Split your money strategically',
                        },
                        {
                          frontLabel: '❌ Common mistake',
                          backLabel: '✅ Smarter approach',
                          front: 'Ignoring digital banks because they\'re "new" and seem risky.',
                          back: 'All MAS-licensed digital banks are SDIC-insured. GXS and Trust have been operating since 2022 with no issues — licensed means protected.',
                          tag: 'Licensed = protected',
                        },
                        {
                          frontLabel: '❌ Common mistake',
                          backLabel: '✅ Smarter approach',
                          front: 'Keeping your emergency fund in a standard savings account earning 0.05%.',
                          back: 'Park your emergency fund in a digital bank or high-yield account earning 2–3%+ while keeping it fully accessible. Idle money should always be earning.',
                          tag: 'Make idle money work',
                        },
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'The Two-Bank Strategy',
                    },
                    {
                      type: 'table',
                      headers: ['Account Role', 'Best Option'],
                      rows: [
                        ['Primary daily account', 'DBS / OCBC / UOB (ATM access, bill payments)'],
                        ['High-yield savings pot', 'GXS, Trust, or MariBank (2–3%+ base rate, no conditions)'],
                        ['Emergency fund', 'Trust Bank or GXS (zero fees, accessible, earns interest)'],
                        ['Grocery rewards', 'Trust Bank (LinkPoints at FairPrice and Kopitiam)'],
                        ['Grab user savings', 'GXS Bank (ecosystem benefits, FlexiLoan if needed)'],
                      ],
                      firstColAccent: true,
                    },
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: Opening a Trust Bank account takes under 5 minutes in-app — no paperwork, no branch visit, no minimum balance. It\'s the lowest-friction way to start earning 2%+ on your savings today.',
                    },
                    {
                      type: 'bot',
                      label: '💬 How do I open a GXS or Trust Bank account in Singapore?',
                      prompt: 'how to open GXS Bank Trust Bank account Singapore steps requirements 2025',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '4-2-s3-scenarios',
                      fincoins: 10,
                      title: 'Digital or Traditional?',
                      scenarios: [
                        {
                          icon: '💰',
                          situation: 'You have $1,200 sitting in your standard DBS savings account earning 0.05%. You don\'t need this money for at least 6 months. What\'s the best move?',
                          options: [
                            {
                              text: 'Leave it — DBS is safer than digital banks.',
                              biasLabel: 'Safety misconception',
                              biasExplanation: 'All MAS-licensed digital banks are SDIC-insured to the same $75,000 limit as DBS. Safety is equal — but you\'re leaving ~$35/year in interest on the table.',
                              isIdeal: false,
                            },
                            {
                              text: 'Move it to a GXS or Trust account earning 2–3%+ while keeping it accessible.',
                              biasLabel: 'Smart move ✓',
                              biasExplanation: 'Same protection, significantly higher interest. $1,200 at 3% earns $36/year vs $0.60 at 0.05%. No minimum balance, fully accessible — zero downside.',
                              isIdeal: true,
                            },
                            {
                              text: 'Invest it in a robo-advisor for even better returns.',
                              biasLabel: 'Wrong horizon',
                              biasExplanation: 'If you might need this money in 6 months, it\'s too short to invest — markets can drop 20%+ in that window. A high-yield savings account is the right tool.',
                              isIdeal: false,
                            },
                          ],
                        },
                        {
                          icon: '🛒',
                          situation: 'You do most of your grocery shopping at FairPrice and Kopitiam every week. You\'re looking for a new bank account. Which digital bank adds the most value?',
                          options: [
                            {
                              text: 'GXS Bank — best interest rates in the market.',
                              biasLabel: 'Mismatched ecosystem',
                              biasExplanation: 'GXS is great for Grab users, but doesn\'t integrate with FairPrice. You\'d miss out on the grocery rewards that directly match your spending habits.',
                              isIdeal: false,
                            },
                            {
                              text: 'Trust Bank — earns LinkPoints at FairPrice and Kopitiam.',
                              biasLabel: 'Best fit ✓',
                              biasExplanation: 'Trust Bank is backed by NTUC FairPrice — it earns LinkPoints on exactly where you already spend. Competitive interest rates plus grocery rewards is the right combination.',
                              isIdeal: true,
                            },
                            {
                              text: 'MariBank — simplest interface, no complications.',
                              biasLabel: 'No grocery integration',
                              biasExplanation: 'MariBank is Shopee-focused and offers no FairPrice integration or grocery rewards. It\'s a good account but not the best fit for this spending pattern.',
                              isIdeal: false,
                            },
                          ],
                        },
                        {
                          icon: '🎓',
                          situation: 'You\'re a student with no credit history and need a small loan to cover a laptop before your allowance arrives next month. Which bank is most likely to help?',
                          options: [
                            {
                              text: 'DBS — largest bank, most likely to approve.',
                              biasLabel: 'Credit history required',
                              biasExplanation: 'Traditional banks require a formal credit history for loans — as a student with none, DBS is unlikely to approve a personal loan application.',
                              isIdeal: false,
                            },
                            {
                              text: 'GXS Bank — FlexiLoan doesn\'t require a formal credit history.',
                              biasLabel: 'Best fit ✓',
                              biasExplanation: 'GXS FlexiLoan is specifically designed for underserved earners without credit history — including students. It\'s the most accessible credit product for this situation.',
                              isIdeal: true,
                            },
                            {
                              text: 'Trust Bank — zero fees mean lowest borrowing cost.',
                              biasLabel: 'No loan product',
                              biasExplanation: 'Trust Bank doesn\'t currently offer a loan product equivalent to GXS FlexiLoan. Zero fees applies to the savings account, not credit.',
                              isIdeal: false,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: Digital Banks & Fintech',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on Singapore\'s digital banks, how they compare to traditional banks, and when to use each.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — key facts about Singapore\'s digital banks?',
                      prompt: 'GXS Trust MariBank Singapore digital banks key facts summary comparison 2025',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '4-2-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'Digital Banks & Fintech',
                      questions: [
                        {
                          concept: 'Digital bank landscape',
                          question: 'Which digital bank is best suited for a student who regularly uses Grab for transport and food delivery?',
                          options: [
                            'Trust Bank — backed by Standard Chartered and FairPrice',
                            'MariBank — backed by Sea Limited and Shopee',
                            'GXS Bank — backed by Grab and Singtel',
                            'DBS digibank — widest ATM network and best app',
                          ],
                          correctIndex: 2,
                          explanation: 'GXS Bank is Grab and Singtel\'s digital banking arm — built specifically for the Grab ecosystem. Frequent Grab users get the most value from GXS\'s savings rates and FlexiLoan product.',
                        },
                        {
                          concept: 'Digital vs traditional',
                          question: 'A student says "I won\'t use digital banks — they\'re not as safe as DBS or OCBC." What\'s the accurate response?',
                          options: [
                            'They\'re correct — digital banks carry more risk as they\'re newer institutions',
                            'Digital banks are safer because they have lower fees',
                            'All MAS-licensed digital banks are SDIC-insured to the same $75,000 limit as traditional banks',
                            'Digital banks are only safe for deposits under $10,000',
                          ],
                          correctIndex: 2,
                          explanation: 'SDIC insurance applies equally to all MAS-licensed banks — digital or traditional. GXS, Trust, and MariBank all carry the same $75,000 deposit protection as DBS, OCBC, and UOB.',
                        },
                        {
                          concept: 'Two-bank strategy',
                          question: 'A student uses DBS as their main account but keeps $2,000 in a standard DBS savings account at 0.05% p.a. What should they do with that $2,000?',
                          options: [
                            'Leave it in DBS — convenience outweighs the interest difference',
                            'Move it to a fixed deposit for 12 months for higher returns',
                            'Invest it in a robo-advisor — better long-term returns',
                            'Move it to a digital bank savings account earning 2–3%+ with no lock-in',
                          ],
                          correctIndex: 3,
                          explanation: 'Idle savings in a 0.05% account costs you ~$39/year in foregone interest vs a 2% digital bank account on $2,000. Digital banks have no lock-in and equal SDIC protection — it\'s a straightforward upgrade.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'Name Singapore\'s three licensed digital banks.',
                  a: 'GXS Bank (Grab + Singtel), Trust Bank (Standard Chartered + FairPrice), and MariBank (Sea Limited / Shopee).',
                },
                {
                  q: 'Are digital bank deposits in Singapore protected by SDIC?',
                  a: 'Yes — all MAS-licensed digital banks are SDIC-insured up to $75,000, the same as traditional banks.',
                },
                {
                  q: 'What is GXS FlexiLoan?',
                  a: 'A small personal loan product from GXS Bank that doesn\'t require a formal credit history — useful for students and gig workers.',
                },
                {
                  q: 'What is the smart two-bank strategy for students?',
                  a: 'Use a traditional bank for your primary account (salary, ATM, bills) and a digital bank for a high-yield savings pot earning 2–3%+.',
                },
                {
                  q: 'Which digital bank is linked to FairPrice and earns grocery rewards?',
                  a: 'Trust Bank — backed by Standard Chartered and NTUC FairPrice, it earns LinkPoints on everyday spending.',
                },
              ],
            },
            // ── LESSON 4-3 ──────────────────────────────
            {
              id: '4-3',
              title: 'PayNow & Mobile Payments',
              icon: '💳',
              topic: 'PayNow SGQR Singapore cashless payments',
              duration: '4 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'paynow',
                  title: 'How PayNow Works',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'How PayNow Works',
                    },
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
                      type: 'subheading',
                      text: 'Singapore\'s Three Cashless Layers',
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
                      type: 'bot',
                      label: '💬 How do I register for PayNow as an international student in Singapore?',
                      prompt: 'how to register PayNow international student Singapore bank app steps 2025',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '4-3-s1-tinder',
                      fincoins: 10,
                      title: 'PayNow & Cashless Basics',
                      instruction: 'Swipe right for True · Swipe left for False',
                      statements: [
                        {
                          text: 'PayNow transfers between Singapore banks are free and instant at all hours.',
                          isTrue: true,
                          explanation: 'PayNow is free, instant, and available 24/7 — there are no transfer fees between participating banks regardless of the time or day.',
                        },
                        {
                          text: 'SGQR is a QR code system that only works with DBS PayLah!.',
                          isTrue: false,
                          explanation: 'SGQR is a unified standard — one QR code accepts payments from any bank app or supported e-wallet, including DBS, OCBC, UOB, GrabPay, and more.',
                        },
                        {
                          text: 'E-wallet balances like GrabPay and Shopee Pay are SDIC insured up to $75,000.',
                          isTrue: false,
                          explanation: 'E-wallet balances are NOT SDIC insured — only licensed bank deposits are. Keep large sums in your bank account, not an e-wallet.',
                        },
                        {
                          text: 'You can register PayNow using your mobile number without sharing your bank account number.',
                          isTrue: true,
                          explanation: 'Your mobile number acts as a proxy for your bank account — the sender only needs your number, not your actual account details.',
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'safety',
                  title: 'Staying Safe',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Staying Safe',
                    },
                    {
                      type: 'text',
                      text: 'PayNow is safe — but only if you know the common attack vectors. Singapore\'s cashless convenience comes with scam risks that catch new users off guard.',
                    },
                    {
                      type: 'callout',
                      variant: 'warning',
                      text: 'Scam alert: In 2023, PayNow-related scams cost Singaporeans over $13 million. The most common tactic is a fake "PayNow confirmation" screenshot — always verify transfers in your bank app, never via a screenshot.',
                    },
                    {
                      type: 'subheading',
                      text: 'The Most Common PayNow Scams',
                    },
                    {
                      type: 'flipcards',
                      variant: 'reframe',
                      title: 'Scam tactic → how to protect yourself',
                      cards: [
                        {
                          frontLabel: '🚨 Scam tactic',
                          backLabel: '🛡️ Protection',
                          front: 'Buyer sends a fake PayNow confirmation screenshot when buying something from you on Carousell.',
                          back: 'Never release an item based on a screenshot. Open your bank app and confirm the transfer has actually arrived before handing anything over.',
                          tag: 'Always verify in-app',
                        },
                        {
                          frontLabel: '🚨 Scam tactic',
                          backLabel: '🛡️ Protection',
                          front: 'Someone claims to have sent you too much money by mistake and asks you to return the excess via PayNow.',
                          back: 'Verify any incoming transfer first. Scammers send a fake amount or use a reversible payment, collect your "refund", then reverse the original.',
                          tag: 'Verify before returning',
                        },
                        {
                          frontLabel: '🚨 Scam tactic',
                          backLabel: '🛡️ Protection',
                          front: 'A message claiming your bank account is suspended — click this link and verify via PayNow to restore it.',
                          back: 'Banks never ask you to verify accounts via PayNow transfers. Go directly to your bank\'s official app — never click links in SMS or WhatsApp messages.',
                          tag: 'Go direct, never click links',
                        },
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'Your PayNow Safety Setup',
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
                      label: '💬 What are the most common PayNow scams in Singapore and how to avoid them?',
                      prompt: 'PayNow scams Singapore 2025 most common types how to avoid students',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '4-3-s2-scenarios',
                      fincoins: 10,
                      title: 'Safe or Scam?',
                      scenarios: [
                        {
                          icon: '📸',
                          situation: 'You\'re selling your old laptop on Carousell for $400. The buyer sends a screenshot showing a PayNow transfer to your number. They\'re waiting outside. What do you do?',
                          options: [
                            {
                              text: 'Hand it over — the screenshot looks legitimate.',
                              biasLabel: 'High scam risk',
                              biasExplanation: 'PayNow screenshots are trivially easy to fake. Handing over $400 of goods based on a screenshot is one of the most common Carousell scam scenarios in Singapore.',
                              isIdeal: false,
                            },
                            {
                              text: 'Open your bank app and check if $400 has actually arrived before handing it over.',
                              biasLabel: 'Correct approach ✓',
                              biasExplanation: 'This takes 10 seconds and protects you completely. A legitimate buyer will not mind waiting while you verify. Anyone who refuses this is a red flag.',
                              isIdeal: true,
                            },
                            {
                              text: 'Ask them to send the transfer again just to be safe.',
                              biasLabel: 'Doesn\'t solve the problem',
                              biasExplanation: 'Asking for another transfer doesn\'t help if you\'re still verifying via screenshots. Always check your bank app — not the screenshots, even multiple ones.',
                              isIdeal: false,
                            },
                          ],
                        },
                        {
                          icon: '💸',
                          situation: 'A stranger PayNows you $50 and messages saying it was a mistake — asking you to return it. You check your bank app and the $50 is indeed there.',
                          options: [
                            {
                              text: 'Return the $50 immediately — it\'s the right thing to do.',
                              biasLabel: 'Potential scam',
                              biasExplanation: 'Some scammers send real money via a reversible payment method, collect your "refund" via PayNow (which is instant and non-reversible), then reverse the original. Contact your bank before taking any action.',
                              isIdeal: false,
                            },
                            {
                              text: 'Ignore it — not your problem.',
                              biasLabel: 'Also risky',
                              biasExplanation: 'If it\'s a genuine mistake, keeping the money could have legal implications. The right move is to contact your bank — not to decide unilaterally.',
                              isIdeal: false,
                            },
                            {
                              text: 'Contact your bank to report the situation and follow their guidance before taking action.',
                              biasLabel: 'Correct approach ✓',
                              biasExplanation: 'Your bank can verify the transaction\'s legitimacy and advise the correct process. This protects you legally whether it\'s a scam or a genuine mistake.',
                              isIdeal: true,
                            },
                          ],
                        },
                        {
                          icon: '📱',
                          situation: 'You receive an SMS: "Your DBS account has been suspended. Verify your identity by sending $1 via PayNow to restore access." What do you do?',
                          options: [
                            {
                              text: 'Send the $1 — it\'s only a dollar and you need your account.',
                              biasLabel: 'Classic scam',
                              biasExplanation: 'This is a well-documented scam format. The $1 "verification" confirms your account is live and hands your details to scammers. Banks never verify identity via PayNow transfers.',
                              isIdeal: false,
                            },
                            {
                              text: 'Click the link in the SMS to check if your account is really suspended.',
                              biasLabel: 'Phishing risk',
                              biasExplanation: 'SMS links from unknown numbers are a primary phishing vector. Clicking them can install malware or steal your banking credentials.',
                              isIdeal: false,
                            },
                            {
                              text: 'Ignore the SMS and log into your bank app directly to check your account status.',
                              biasLabel: 'Correct approach ✓',
                              biasExplanation: 'If your account were actually suspended, you\'d see it immediately in the app. Going direct — never via SMS links — is the only safe response.',
                              isIdeal: true,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'tips',
                  title: 'Smart Usage Tips',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Smart Usage Tips',
                    },
                    {
                      type: 'text',
                      text: 'Different situations call for different payment tools. Knowing which to use not only saves you money — it can earn you rewards and keep your spending naturally in check.',
                    },
                    {
                      type: 'subheading',
                      text: 'What\'s the Smartest Way to Pay?',
                    },
                    {
                      type: 'flipcards',
                      variant: 'neutral',
                      title: 'Situation → smartest payment approach',
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
                          back: 'Ask them to use Wise for the international transfer — and register PayNow so local top-ups and transfers land instantly once the money arrives in Singapore.',
                          tag: 'PayNow local, Wise overseas',
                        },
                        {
                          frontLabel: '📍 Situation',
                          backLabel: '✅ Smartest approach',
                          front: 'Ordering GrabFood and taking Grab rides daily.',
                          back: 'Top up GrabPay wallet with a fixed weekly budget — you earn GrabRewards points and the wallet balance naturally caps your Grab spending for the week.',
                          tag: 'E-wallet as a spending cap',
                        },
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'E-Wallet vs PayNow — Which to Use When',
                    },
                    {
                      type: 'table',
                      headers: ['Scenario', 'Best Tool'],
                      rows: [
                        ['Splitting bills with friends', 'PayNow (free, instant, universal)'],
                        ['Paying at hawker / canteen', 'SGQR scan via bank app'],
                        ['Daily Grab rides and food', 'GrabPay wallet (rewards + spending cap)'],
                        ['Receiving money from overseas', 'Wise → then PayNow locally'],
                        ['Large transfers (rent, fees)', 'Bank transfer or PayNow (not e-wallet)'],
                      ],
                      firstColAccent: true,
                    },
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: Current daily PayNow limits for most banks are $200,000. For personal security while studying, consider lowering yours to $1,000–$2,000 — you can raise it instantly in-app whenever you need to.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Current PayNow daily transaction limits and recent scam statistics',
                      prompt: 'PayNow daily transaction limit Singapore banks 2025 scam statistics safety tips',
                    },
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: PayNow & Mobile Payments',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on how Singapore\'s cashless system works, how to stay safe, and which payment tool to use in which situation.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — key PayNow safety rules for students in Singapore?',
                      prompt: 'PayNow safety rules best practices students Singapore cashless 2025',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '4-3-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'PayNow & Mobile Payments',
                      questions: [
                        {
                          concept: 'How PayNow works',
                          question: 'What makes PayNow different from a standard bank transfer?',
                          options: [
                            'PayNow requires the recipient\'s full bank account number and branch code',
                            'PayNow uses your mobile number or NRIC as a proxy — no account details needed, transfers are instant and free',
                            'PayNow transfers are batched and processed the next business day',
                            'PayNow can only be used between accounts at the same bank',
                          ],
                          correctIndex: 1,
                          explanation: 'PayNow maps your mobile number or NRIC to your bank account — senders only need your number. Transfers are instant, free, and work across all participating banks 24/7.',
                        },
                        {
                          concept: 'Staying safe',
                          question: 'You\'re selling textbooks and a buyer sends a PayNow confirmation screenshot. What is the correct next step?',
                          options: [
                            'Accept the screenshot — PayNow confirmations can\'t be faked',
                            'Ask for a second screenshot from a different angle to verify',
                            'Open your bank app and confirm the funds have actually arrived before releasing the item',
                            'Call the buyer to verify — a phone call is enough confirmation',
                          ],
                          correctIndex: 2,
                          explanation: 'Screenshots are trivially easy to fake and are the most common Carousell scam vector. The only reliable verification is checking your bank app directly — takes 10 seconds and protects you completely.',
                        },
                        {
                          concept: 'Smart usage',
                          question: 'A student spends heavily on Grab rides and GrabFood and wants to limit their monthly Grab spending naturally. What is the smartest approach?',
                          options: [
                            'Pay each Grab transaction directly from your bank account for full visibility',
                            'Top up GrabPay wallet with a fixed weekly amount — when it\'s empty, spending stops',
                            'Delete the Grab app at the start of each month until the budget resets',
                            'Use a credit card for all Grab payments for better rewards',
                          ],
                          correctIndex: 1,
                          explanation: 'Topping up GrabPay with a weekly fixed amount creates a natural hard limit — once the wallet is empty, you can\'t spend more without a conscious top-up decision. It also earns GrabRewards points on every transaction.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'What is PayNow?',
                  a: 'Singapore\'s instant, free bank transfer system — link your mobile number or NRIC to your bank account and send money in seconds.',
                },
                {
                  q: 'What is SGQR?',
                  a: 'Singapore\'s unified QR code standard — one QR code accepts payments from any bank app or e-wallet.',
                },
                {
                  q: 'Are e-wallet balances (GrabPay, Shopee Pay) SDIC insured?',
                  a: 'No — only licensed bank deposits are SDIC insured. Keep large sums in your bank account, not an e-wallet.',
                },
                {
                  q: 'How do you verify a PayNow transfer safely?',
                  a: 'Always check your bank app directly — never accept a screenshot as proof of payment.',
                },
                {
                  q: 'What is one smart way to limit Grab overspending?',
                  a: 'Top up your GrabPay wallet with a fixed weekly budget — it naturally caps your spending and earns rewards.',
                },
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
            // ── LESSON 5-1 ──────────────────────────────
            {
              id: '5-1',
              title: 'How HYSA Interest Works',
              icon: '🧮',
              topic: 'High yield savings account interest rates Singapore',
              duration: '6 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'how',
                  title: 'How Bonus Interest Works',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'How Bonus Interest Works',
                    },
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
                      type: 'bot',
                      label: '💬 Current interest rates for DBS Multiplier, OCBC 360, and UOB One',
                      prompt: 'current interest rates DBS Multiplier OCBC 360 UOB One Singapore 2025 conditions bonus tiers',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '5-1-s1-tinder',
                      fincoins: 10,
                      title: 'HYSA Interest — True or False?',
                      instruction: 'Swipe right for True · Swipe left for False',
                      statements: [
                        {
                          text: 'HYSA bonus interest is automatically applied every month regardless of your activity.',
                          isTrue: false,
                          explanation: 'Bonus interest must be earned by meeting specific conditions each month — salary credit, card spend, GIRO payments. Miss the conditions, miss the bonus.',
                        },
                        {
                          text: 'The base interest rate on most Singapore savings accounts is around 0.05% p.a.',
                          isTrue: true,
                          explanation: 'The base rate is what you earn without meeting any conditions — effectively nothing. The value of an HYSA comes entirely from the bonus tiers on top.',
                        },
                        {
                          text: 'Your effective HYSA rate is fixed and does not change from month to month.',
                          isTrue: false,
                          explanation: 'Your effective rate is recalculated monthly based on which conditions you met. A missed condition in March means a lower rate for March only — it resets the following month.',
                        },
                        {
                          text: 'Most students can realistically achieve 2–4% p.a. on an HYSA by meeting 2–3 conditions.',
                          isTrue: true,
                          explanation: 'Salary credit, card spend, and a GIRO payment are the most achievable conditions — and together they typically unlock 2–4% p.a. for a student with part-time income.',
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'qualify',
                  title: 'Qualifying Conditions',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Qualifying Conditions',
                    },
                    {
                      type: 'text',
                      text: 'Every HYSA has its own set of qualifying conditions — but they all fall into the same four categories. Here\'s what counts and how much each typically adds to your rate.',
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
                      type: 'callout',
                      variant: 'tip',
                      text: 'Example: $10,000 in a UOB One account, salary credited + $500/month card spend = ~3% p.a. effective rate. That\'s $300/year — $25/month — just from meeting two conditions. The same balance in a basic account at 0.05% earns $5/year.',
                    },
                    {
                      type: 'subheading',
                      text: 'Common HYSA Mistakes',
                    },
                    {
                      type: 'flipcards',
                      variant: 'reframe',
                      title: 'Common mistakes → what to do instead:',
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
                      type: 'bot',
                      label: '💬 What are the qualifying conditions for UOB One, OCBC 360, and DBS Multiplier?',
                      prompt: 'UOB One OCBC 360 DBS Multiplier qualifying conditions salary card spend GIRO 2025 Singapore',
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'calc',
                  title: 'Calculating Your Earnings',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Calculating Your Earnings',
                    },
                    {
                      type: 'text',
                      text: 'Let\'s make this concrete. Drag the slider to your current savings and see exactly what you\'d earn at each interest rate — basic account vs HYSA with conditions met.',
                    },
                    {
                      type: 'slider',
                      icon: '🧮',
                      title: 'Annual Interest Earnings',
                      description: 'Drag to your savings amount and see what different accounts earn you per year.',
                      min: 500,
                      max: 20000,
                      step: 500,
                      initialValue: 5000,
                      prefix: '$',
                      calculateResult: (amount) => [
                        { label: '🔴 Basic savings (0.05%)', value: `$${(amount * 0.0005).toFixed(2)}/yr`, color: '#DC2626' },
                        { label: '🟡 HYSA base only (0.05%)', value: `$${(amount * 0.0005).toFixed(2)}/yr`, color: '#D97706' },
                        { label: '🟠 HYSA + card spend only (~1.5%)', value: `$${(amount * 0.015).toFixed(2)}/yr`, color: '#EA580C' },
                        { label: '🟢 HYSA + salary + card spend (~3%)', value: `$${(amount * 0.03).toFixed(2)}/yr`, color: '#059669' },
                        { label: '💎 HYSA fully optimised (~4.5%)', value: `$${(amount * 0.045).toFixed(2)}/yr`, color: '#7C3AED' },
                      ],
                    },
                    {
                      type: 'callout',
                      variant: 'fact',
                      text: 'A student with $5,000 saved earns $2.50/year at the base rate. Meeting salary credit and card spend conditions on a UOB One account earns $150/year on the same balance — 60x more.',
                    },
                    {
                      type: 'subheading',
                      text: 'Which Account for Which Situation?',
                    },
                    {
                      type: 'bot',
                      label: '💬 Which HYSA is best for a student with a part-time salary in Singapore?',
                      prompt: 'best high yield savings account Singapore student part-time salary internship 2025 UOB OCBC DBS',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '5-1-s3-scenarios',
                      fincoins: 10,
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
                              biasExplanation: 'Spending more just to earn interest is counterproductive — the bonus earned rarely outweighs the extra spending required to unlock it.',
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
                              biasExplanation: 'OCBC 360 offers the highest rates only on the first $75,000 — but bonus tiers may apply differently across tranches. Verify before assuming the full rate applies.',
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
                              biasExplanation: 'Fixed deposits offer certainty but lock up your money. SSBs are more flexible — redeemable any month with no penalty — making them the better choice for accessible savings.',
                              isIdeal: false,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: How HYSA Interest Works',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on how HYSA interest is structured, which conditions matter most, and how to apply this to your own situation.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — how does HYSA bonus interest work in Singapore?',
                      prompt: 'how does HYSA bonus interest work Singapore salary credit card spend GIRO conditions recap 2025',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '5-1-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'How HYSA Interest Works',
                      questions: [
                        {
                          concept: 'Interest structure',
                          question: 'A student opens an OCBC 360 account but never sets up salary credit or card spend. What interest rate will they earn?',
                          options: [
                            'The full advertised rate — opening the account is enough',
                            'Around 0.05% p.a. — the base rate only, with no bonus tiers unlocked',
                            'Around 2% p.a. — OCBC 360 gives a default bonus to new customers',
                            'Zero — HYSAs only pay interest when all conditions are met',
                          ],
                          correctIndex: 1,
                          explanation: 'Without meeting any qualifying conditions, only the base rate applies — around 0.05% p.a. The advertised rates are the maximum achievable when all conditions are met, not the default.',
                        },
                        {
                          concept: 'Qualifying conditions',
                          question: 'Which single condition typically adds the most bonus interest to a Singapore HYSA?',
                          options: [
                            'Setting up 3 GIRO bill payments',
                            'Purchasing an insurance product from the bank',
                            'Crediting your monthly salary to the same bank',
                            'Spending $200/month on a linked debit card',
                          ],
                          correctIndex: 2,
                          explanation: 'Salary credit is the highest-value condition for most HYSAs — typically adding 1–3% p.a. on its own. Missing it while meeting other conditions still leaves significant interest on the table.',
                        },
                        {
                          concept: 'Applying the rules',
                          question: 'A student earns 4% p.a. on their OCBC 360 in January by meeting all conditions. In February, they forget to spend $500 on their OCBC card. What happens?',
                          options: [
                            'They lose the 4% rate permanently and must reapply',
                            'Nothing changes — HYSA rates are fixed for 12 months once unlocked',
                            'They earn a lower rate in February only — the card spend bonus is removed for that month',
                            'Their account is suspended until they meet the minimum spend again',
                          ],
                          correctIndex: 2,
                          explanation: 'HYSA rates are recalculated monthly. Missing the card spend condition in February removes that bonus tier for February only — all other conditions still apply, and the full rate returns in March if the spend is met again.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'What is a High-Yield Savings Account (HYSA)?',
                  a: 'A savings account that earns significantly more than a standard account — but only when you meet specific monthly conditions like salary credit, card spend, or GIRO payments.',
                },
                {
                  q: 'What is the base interest rate on most Singapore savings accounts?',
                  a: 'Around 0.05% p.a. — essentially nothing. The real value of an HYSA comes from the bonus tiers on top.',
                },
                {
                  q: 'What is the single most valuable condition to meet on most HYSAs?',
                  a: 'Salary credit — crediting your monthly pay to the same bank as your HYSA unlocks the biggest bonus tier, often adding 1–3% p.a.',
                },
                {
                  q: 'How often is HYSA bonus interest recalculated?',
                  a: 'Monthly — if you miss a condition in a given month, you lose that bonus for that month only. It resets the following month.',
                },
                {
                  q: 'What should you do with savings above an HYSA\'s balance cap?',
                  a: 'Split excess funds into Singapore Savings Bonds or fixed deposits — most HYSAs only apply their highest rates up to $50,000–$100,000.',
                },
              ],
            },
            
            // ── LESSON 5-2 ──────────────────────────────
            {
              id: '5-2',
              title: 'OCBC 360 vs UOB One vs DBS Multiplier',
              icon: '⚖️',
              topic: 'OCBC 360 UOB One DBS Multiplier comparison Singapore',
              duration: '7 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'compare',
                  title: 'Side-by-Side Comparison',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Side-by-Side Comparison',
                    },
                    {
                      type: 'text',
                      text: 'DBS Multiplier, OCBC 360, and UOB One are Singapore\'s three most popular high-yield savings accounts. All three can earn significantly more than a basic account — but they reward different behaviours. The best one depends entirely on how you actually use your money.',
                    },
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Interest rates for all three accounts change periodically. The numbers in this lesson are illustrative — use the bot chip at the end of each section to get today\'s exact rates before making a decision.',
                    },
                    {
                      type: 'subheading',
                      text: 'At a Glance',
                    },
                    {
                      type: 'table',
                      headers: ['Account', 'Key Condition', 'Illustrative Max Rate', 'Best For'],
                      rows: [
                        ['DBS Multiplier', 'Total monthly DBS transactions across products', 'Up to ~4.1% p.a.', 'DBS ecosystem users with salary + card spend'],
                        ['OCBC 360', 'Salary + card spend + GIRO + insurance/investment', 'Up to ~4.65% p.a.', 'Students who want savings pockets + goal tracking'],
                        ['UOB One', 'Salary + $500/month card spend + 3 GIRO payments', 'Up to ~4.0% p.a.', 'Students with consistent monthly card spend'],
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'A Closer Look at Each Account',
                    },
                    {
                      type: 'topiccards',
                      cards: [
                        {
                          icon: '🔴',
                          label: 'DBS Multiplier',
                          description: 'Rewards total transaction volume across DBS products',
                          color: '#DC2626',
                          details: [
                            'Interest scales with your total monthly transactions across DBS products — salary, card spend, insurance, investments, home loan',
                            'No fixed minimum spend — the more DBS products you use, the higher your rate',
                            'Integrates with DBS NAV Planner for spending and savings tracking in one app',
                          ],
                          example: 'A student who credits salary to DBS and spends on a DBS card can realistically earn 2–3% p.a. — check the bot for today\'s exact tiered rates.',
                        },
                        {
                          icon: '🟠',
                          label: 'OCBC 360',
                          description: 'Rewards specific monthly actions with separate bonus tiers',
                          color: '#EA580C',
                          details: [
                            'Each condition unlocks a separate bonus tier — salary, card spend, GIRO, insurance/investment',
                            'Savings Pockets feature lets you create named sub-accounts for different goals within one account',
                            'Most student-friendly onboarding — low minimum balance and no fall-below fee for students',
                          ],
                          example: 'A student meeting salary credit + card spend conditions could earn 2.5–4% p.a. — use the bot chip for current tier breakdowns.',
                        },
                        {
                          icon: '🔵',
                          label: 'UOB One',
                          description: 'Simple, clearly defined conditions with strong interest',
                          color: '#1D4ED8',
                          details: [
                            'Simplest structure of the three — meet salary + $500 card spend + 3 GIRO debits and you\'re done',
                            'Interest applied in balance bands — different rates for the first $30,000, next $30,000, and so on',
                            'UOB TMRW app offers spending insights and savings nudges aimed at younger users',
                          ],
                          example: 'A student crediting salary and spending $500/month on a UOB card could earn 3–4% p.a. — check the bot for latest band rates.',
                        },
                      ],
                    },
                    {
                      type: 'bot',
                      label: '💬 Current interest rates for DBS Multiplier, OCBC 360, and UOB One',
                      prompt: 'current interest rates qualifying conditions DBS Multiplier OCBC 360 UOB One Singapore 2025',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '5-2-s1-tinder',
                      fincoins: 10,
                      title: 'HYSA Comparison — True or False?',
                      instruction: 'Swipe right for True · Swipe left for False',
                      statements: [
                        {
                          text: 'DBS Multiplier rewards total transaction volume across DBS products — not just salary credit alone.',
                          isTrue: true,
                          explanation: 'Unlike OCBC 360 and UOB One which have fixed condition categories, DBS Multiplier rewards the total value of your monthly transactions across all DBS products — the more you use, the higher your rate.',
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
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'student',
                  title: 'Best Option for Students',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Best Option for Students',
                    },
                    {
                      type: 'text',
                      text: 'The right account depends on your situation right now — not which account has the highest headline rate. Here\'s what each account realistically earns at different student life stages.',
                    },
                    {
                      type: 'flipcards',
                      variant: 'neutral',
                      title: 'What does each account realistically earn for a student?',
                      cards: [
                        {
                          frontLabel: '🔴 DBS Multiplier',
                          backLabel: '📊 Realistic student rate',
                          front: 'Key condition: Total monthly DBS transactions — salary + card spend + other DBS products.',
                          back: 'Salary credit + DBS card spend → realistically 2–3% p.a. Without salary credit, hitting meaningful bonus tiers is difficult. Best once you\'re deeply in the DBS ecosystem.',
                          tag: 'Best for full-time DBS users',
                        },
                        {
                          frontLabel: '🟠 OCBC 360',
                          backLabel: '📊 Realistic student rate',
                          front: 'Key condition: Salary credit + card spend + GIRO + optional insurance/investment bonus.',
                          back: 'Salary + card spend + GIRO → 2.5–4% p.a. Without salary, card spend and GIRO tiers still add 0.5–1.5% above base. Savings Pockets helps organise goals at any stage.',
                          tag: 'Most flexible for students',
                        },
                        {
                          frontLabel: '🔵 UOB One',
                          backLabel: '📊 Realistic student rate',
                          front: 'Key condition: Salary credit + min. $500/month card spend + 3 GIRO payments.',
                          back: 'All three conditions met → 3–4% p.a. Simplest structure to qualify for once employed. If you already spend $500/month on a UOB card, this is the easiest HYSA to maximise.',
                          tag: 'Simplest to qualify for once employed',
                        },
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'Which Account Fits Your Situation?',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '5-2-s2-scenarios',
                      fincoins: 10,
                      title: 'Which account fits your situation?',
                      scenarios: [
                        {
                          icon: '🎓',
                          situation: 'You\'re a full-time student with no salary yet, spending about $300–$400/month across various apps and cards.',
                          options: [
                            {
                              text: 'Open an OCBC 360 and focus on the card spend and GIRO tiers only.',
                              biasLabel: 'Smart starting point ✓',
                              biasExplanation: 'Without salary credit you can\'t unlock the biggest tier, but OCBC 360\'s card spend and GIRO bonuses are still achievable — and Savings Pockets helps organise your goals while you study.',
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
                              biasExplanation: 'If you can\'t meet any HYSA conditions, a digital bank\'s flat rate beats the HYSA base of 0.05%. A perfectly reasonable choice until you have a salary.',
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
                          situation: 'You\'ve just started full-time work, salary credited to DBS, spending across multiple DBS products — card, insurance, and potentially a home loan in future.',
                          options: [
                            {
                              text: 'Open a DBS Multiplier and consolidate all transactions within the DBS ecosystem.',
                              biasLabel: 'Best long-term fit ✓',
                              biasExplanation: 'DBS Multiplier is designed exactly for this — it rewards total DBS transaction volume. The more DBS products you use over time, the higher your effective rate becomes.',
                              isIdeal: true,
                            },
                            {
                              text: 'Switch to OCBC 360 for the higher headline rate.',
                              biasLabel: 'Headline vs reality',
                              biasExplanation: 'OCBC 360\'s headline rate requires meeting all conditions including insurance/investment products. If your ecosystem is already DBS, switching adds friction without guaranteed benefit.',
                              isIdeal: false,
                            },
                            {
                              text: 'Split salary between DBS Multiplier and UOB One to diversify.',
                              biasLabel: 'Splitting dilutes conditions',
                              biasExplanation: 'Most HYSAs require full salary credit to unlock their biggest tier — splitting your salary means neither account qualifies for the full bonus.',
                              isIdeal: false,
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'bot',
                      label: '💬 Which HYSA is best for a student with a part-time internship salary in Singapore?',
                      prompt: 'best high yield savings account Singapore student internship part-time salary OCBC 360 UOB One DBS Multiplier 2025',
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'exercise',
                  title: 'Calculate Your Returns',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Calculate Your Returns',
                    },
                    {
                      type: 'text',
                      text: 'Use the sliders below to estimate how much you could earn annually in each account. These figures are illustrative — based on published condition structures. Use the bot chip at the bottom for today\'s exact rates.',
                    },
                    {
                      type: 'slider',
                      icon: '🔴',
                      title: 'DBS Multiplier: Annual Interest Estimator',
                      description: 'Drag to your savings balance to see estimated annual interest (illustrative 2.5% p.a. for salary credit + card spend).',
                      min: 1000,
                      max: 50000,
                      step: 1000,
                      initialValue: 10000,
                      prefix: '$',
                      calculateResult: (balance) => [
                        { label: '💰 Estimated annual interest', value: `$${(balance * 0.025).toFixed(0)}`, color: '#DC2626' },
                        { label: '📅 Monthly earnings', value: `$${(balance * 0.025 / 12).toFixed(2)}`, color: '#4F46E5' },
                        { label: '📈 vs basic account (0.05%)', value: `+$${(balance * 0.025 - balance * 0.0005).toFixed(0)}/yr more`, color: '#059669' },
                      ],
                    },
                    {
                      type: 'slider',
                      icon: '🟠',
                      title: 'OCBC 360: Annual Interest Estimator',
                      description: 'Drag to your savings balance to see estimated annual interest (illustrative 3% p.a. for salary + card spend + GIRO).',
                      min: 1000,
                      max: 50000,
                      step: 1000,
                      initialValue: 10000,
                      prefix: '$',
                      calculateResult: (balance) => [
                        { label: '💰 Estimated annual interest', value: `$${(balance * 0.03).toFixed(0)}`, color: '#EA580C' },
                        { label: '📅 Monthly earnings', value: `$${(balance * 0.03 / 12).toFixed(2)}`, color: '#4F46E5' },
                        { label: '📈 vs basic account (0.05%)', value: `+$${(balance * 0.03 - balance * 0.0005).toFixed(0)}/yr more`, color: '#059669' },
                      ],
                    },
                    {
                      type: 'slider',
                      icon: '🔵',
                      title: 'UOB One: Annual Interest Estimator',
                      description: 'Drag to your savings balance to see estimated annual interest (illustrative 3.5% p.a. for salary + $500 spend + 3 GIRO).',
                      min: 1000,
                      max: 50000,
                      step: 1000,
                      initialValue: 10000,
                      prefix: '$',
                      calculateResult: (balance) => [
                        { label: '💰 Estimated annual interest', value: `$${(balance * 0.035).toFixed(0)}`, color: '#1D4ED8' },
                        { label: '📅 Monthly earnings', value: `$${(balance * 0.035 / 12).toFixed(2)}`, color: '#4F46E5' },
                        { label: '📈 vs basic account (0.05%)', value: `+$${(balance * 0.035 - balance * 0.0005).toFixed(0)}/yr more`, color: '#059669' },
                      ],
                    },
                    {
                      type: 'callout',
                      variant: 'fact',
                      text: 'On a $10,000 balance: DBS Multiplier earns ~$250/yr, OCBC 360 earns ~$300/yr, UOB One earns ~$350/yr — vs $5/yr in a basic savings account. Same money, wildly different outcomes.',
                    },
                    {
                      type: 'subheading',
                      text: 'Quick Decision Guide',
                    },
                    {
                      type: 'table',
                      headers: ['Your Situation', 'Best Account'],
                      rows: [
                        ['No salary, spending < $500/month', 'OCBC 360 (card + GIRO tiers) or digital bank'],
                        ['Internship salary + UOB card spend', 'UOB One (simplest conditions to unlock)'],
                        ['Full-time salary + multiple DBS products', 'DBS Multiplier (rewards ecosystem depth)'],
                        ['Want goal-based savings pockets', 'OCBC 360 (Savings Pockets feature)'],
                        ['Already spending $500/month on UOB card', 'UOB One (conditions already halfway met)'],
                      ],
                      firstColAccent: true,
                    },
                    {
                      type: 'bot',
                      label: '💬 Current interest rates for DBS Multiplier, OCBC 360, and UOB One',
                      prompt: 'current interest rates and qualifying conditions DBS Multiplier OCBC 360 UOB One Singapore 2025 comparison',
                    },
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: OCBC 360 vs UOB One vs DBS Multiplier',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on how the accounts differ, which suits which student profile, and the one mistake that kills bonus interest on all three.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — key differences between DBS Multiplier, OCBC 360, and UOB One?',
                      prompt: 'DBS Multiplier vs OCBC 360 vs UOB One key differences Singapore students 2025 summary',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '5-2-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'OCBC 360 vs UOB One vs DBS Multiplier',
                      questions: [
                        {
                          concept: 'Account structure',
                          question: 'What makes DBS Multiplier structurally different from OCBC 360 and UOB One?',
                          options: [
                            'DBS Multiplier requires no conditions — it gives the highest rate automatically',
                            'DBS Multiplier rewards total transaction volume across DBS products, not fixed condition categories',
                            'DBS Multiplier only applies to balances above $50,000',
                            'DBS Multiplier pays interest weekly instead of monthly',
                          ],
                          correctIndex: 1,
                          explanation: 'OCBC 360 and UOB One have fixed condition categories (salary, card spend, GIRO). DBS Multiplier is different — it rewards the total value of your monthly transactions across all DBS products. More products, higher rate.',
                        },
                        {
                          concept: 'Student profile matching',
                          question: 'A student is 3 months into an internship earning $1,500/month and already spends $600/month on their UOB debit card. Which account should they prioritise?',
                          options: [
                            'OCBC 360 — highest potential headline rate',
                            'DBS Multiplier — rewards the most transaction types',
                            'UOB One — two of three conditions already met, just add one GIRO payment',
                            'A digital bank — simpler and no conditions needed',
                          ],
                          correctIndex: 2,
                          explanation: 'This student already meets UOB One\'s salary credit and card spend conditions. Adding one GIRO payment (phone bill, transport) unlocks the full bonus tier with minimal extra effort — no account switching required.',
                        },
                        {
                          concept: 'Common mistakes',
                          question: 'A student has a UOB One account but credits their internship salary to a separate DBS account for convenience. What is the most likely impact?',
                          options: [
                            'No impact — UOB One doesn\'t require salary credit',
                            'They lose the card spend bonus only',
                            'They lose the salary credit bonus tier — the single biggest HYSA condition — and earn a much lower effective rate',
                            'Their UOB One account is automatically closed after 3 months without salary credit',
                          ],
                          correctIndex: 2,
                          explanation: 'Salary credit to the same bank is the highest-value condition for most HYSAs. Crediting elsewhere — even to a different account at the same bank — typically disqualifies you from the salary tier, costing 1–3% p.a. in lost bonus interest.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'What is the key qualifying condition for UOB One?',
                  a: 'Salary credit + minimum $500/month card spend + 3 GIRO payments — meet all three to unlock the full bonus rate.',
                },
                {
                  q: 'What makes DBS Multiplier different from OCBC 360 and UOB One?',
                  a: 'DBS Multiplier rewards total transaction volume across all DBS products — the more DBS services you use, the higher your rate. The others have fixed condition categories.',
                },
                {
                  q: 'Which HYSA is most suitable for a student with no salary yet?',
                  a: 'OCBC 360 — its card spend and GIRO tiers are achievable without salary credit, and Savings Pockets help with goal tracking.',
                },
                {
                  q: 'What is a realistic effective rate for a student meeting 2–3 HYSA conditions?',
                  a: 'Roughly 2–4% p.a. depending on the account and conditions met — significantly better than the 0.05% base rate.',
                },
                {
                  q: 'Why should you avoid splitting your salary between two HYSAs?',
                  a: 'Most HYSAs require full salary credit to unlock their biggest bonus tier — splitting means neither account qualifies, and you lose the highest-value condition on both.',
                },
              ],
            },
            // ── LESSON 5-3 ──────────────────────────────
            {
              id: '5-3',
              title: 'Maximising Your Interest',
              icon: '🔑',
              topic: 'Maximising bank interest Singapore student strategies',
              duration: '5 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'stack',
                  title: 'Stacking Interest Conditions',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Stacking Interest Conditions',
                    },
                    {
                      type: 'text',
                      text: 'Earning high interest isn\'t about finding the best account — every student has already heard about DBS Multiplier, OCBC 360, and UOB One. The difference between students who actually earn 3–4% p.a. and those stuck at 0.05% is one thing: consistently meeting conditions. This lesson is about building the system that makes that happen automatically.',
                    },
                    {
                      type: 'callout',
                      variant: 'fact',
                      text: 'Most account holders who open HYSAs never fully maximise their bonus tiers — they set up the account once and forget to optimise their behaviour around it.',
                    },
                    {
                      type: 'keyterm',
                      term: 'Interest Stacking',
                      definition: 'Deliberately structuring your financial behaviour — salary credit, card spend, GIRO payments — to meet multiple HYSA bonus tiers simultaneously, maximising your effective interest rate every month.',
                    },
                    {
                      type: 'subheading',
                      text: 'The Three Interest-Stacking Levers',
                    },
                    {
                      type: 'text',
                      text: 'There are three levers you can pull to maximise your HYSA rate. Each one unlocks a different bonus tier — and all three can be set up once and run automatically.',
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
                          tip: 'When starting a new job or internship, the first thing you do is tell HR to credit your salary to your HYSA — not your everyday account.',
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
                      type: 'bot',
                      label: '💬 Have any HYSA conditions or rates changed recently?',
                      prompt: 'latest changes DBS Multiplier OCBC 360 UOB One conditions interest rates Singapore 2025',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '5-3-s1-tinder',
                      fincoins: 10,
                      title: 'Maximising Interest — True or False?',
                      instruction: 'Swipe right for True · Swipe left for False',
                      statements: [
                        {
                          text: 'A manual salary transfer from one bank to your HYSA counts the same as payroll GIRO for salary credit conditions.',
                          isTrue: false,
                          explanation: 'Most banks require salary to be credited via payroll GIRO and labelled as salary. A manual transfer may not be recognised as salary credit — always confirm with your bank and update through HR.',
                        },
                        {
                          text: 'Setting up GIRO for recurring bills is one of the easiest HYSA conditions to automate.',
                          isTrue: true,
                          explanation: 'Phone, utilities, and insurance GIRO payments qualify for most HYSAs\' GIRO conditions — set them up once and they run automatically every month.',
                        },
                        {
                          text: 'Routing existing subscriptions like Netflix and Spotify to your HYSA\'s linked card is a cost-free way to increase qualifying card spend.',
                          isTrue: true,
                          explanation: 'You\'re already paying for these subscriptions — switching the payment card costs nothing and adds to your monthly qualifying spend without any extra outlay.',
                        },
                        {
                          text: 'Spending extra money you wouldn\'t otherwise spend is a good strategy to hit a card spend threshold.',
                          isTrue: false,
                          explanation: 'Spending $80 extra to earn $15 in bonus interest is a net loss. Always consolidate existing spending to hit thresholds — never manufacture new spending.',
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'automate',
                  title: 'Automating for Passive Gains',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Automating for Passive Gains',
                    },
                    {
                      type: 'text',
                      text: 'The goal is to make interest maximisation require zero monthly decision-making. Once your salary credit, GIRO payments, and card spend are set up correctly, your HYSA runs on autopilot.',
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
                      type: 'subheading',
                      text: 'Set-and-Forget Mistakes',
                    },
                    {
                      type: 'flipcards',
                      variant: 'reframe',
                      title: 'Common set-and-forget mistakes → one-time fixes:',
                      cards: [
                        {
                          frontLabel: '❌ Mistake',
                          backLabel: '✅ One-time fix',
                          front: 'Your salary is credited to your HYSA but your daily spending card is from a different bank — so you never hit the card spend threshold.',
                          back: 'Order the linked debit or credit card from your HYSA bank and set it as your default. One card switch, permanent fix — the spend accumulates passively from then on.',
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
                      type: 'bot',
                      label: '💬 How do I set up GIRO payments for SP Group and phone bills in Singapore?',
                      prompt: 'how to set up GIRO payments Singapore SP Group phone bill bank app HYSA 2025',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '5-3-s2-scenarios',
                      fincoins: 10,
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
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'review',
                  title: 'Annual Account Review',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Annual Account Review',
                    },
                    {
                      type: 'text',
                      text: 'Banks revise HYSA conditions and rates more often than most people realise. A 30-minute annual account review is one of the highest-value financial habits you can build — here\'s exactly what it could be worth.',
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
                        { label: '💸 You\'re leaving on the table', value: `$${(balance * 0.03 - balance * 0.0005).toFixed(0)}/year`, color: '#DC2626' },
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'What to Check in Your Annual Review',
                    },
                    {
                      type: 'steps',
                      steps: [
                        'Pull up your monthly interest breakdown — open your bank app and check the last 3 months of interest earned. Most HYSAs show a tier-by-tier breakdown so you can see exactly which conditions you hit and which you missed.',
                        'Check the bank\'s current published conditions — go to your bank\'s website and compare current conditions against what you set up for. Conditions change — you may be meeting tiers that no longer exist, or missing new ones.',
                        'Calculate your effective rate — divide your annual interest earned by your average balance. If your effective rate is more than 0.5% below what you should be earning, something is misaligned.',
                        'Benchmark against competitors — spend 5 minutes checking whether OCBC 360, UOB One, or DBS Multiplier now offers better terms for your profile. Use the bot chip below for today\'s exact rates.',
                        'Fix one thing, then automate — identify the single easiest fix (a GIRO payment, a card switch, an HR payroll update) and action it before closing the review. One change per review compounds over time.',
                      ],
                    },
                   
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: Set a recurring calendar reminder every January — "HYSA Annual Review". A 30-minute check on a $20,000 balance that finds just 1% more in missed conditions is worth $200/year, every year.',
                    },
                    {
                      type: 'table',
                      headers: ['Review Area', 'What to Check', 'Time Needed'],
                      rows: [
                        ['Interest breakdown', 'Which tiers you hit vs missed in the last 3 months', '5 min'],
                        ['Current conditions', 'Bank\'s published conditions vs what you set up for', '5 min'],
                        ['Effective rate check', 'Annual interest ÷ average balance = your real rate', '5 min'],
                        ['Competitor benchmark', 'Best rates available for your profile today', '10 min'],
                        ['Fix + automate', 'One actionable change before closing the review', '5 min'],
                      ],
                      firstColAccent: true,
                    },
                    {
                      type: 'bot',
                      label: '💬 Have any HYSA conditions or rates changed recently in Singapore?',
                      prompt: 'latest changes DBS Multiplier OCBC 360 UOB One interest rates conditions Singapore 2025 updates',
                    },
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: Maximising Your Interest',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on interest stacking, automation, and the annual review habit.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — what are the three levers for maximising HYSA interest?',
                      prompt: 'how to maximise HYSA interest Singapore salary credit card spend GIRO stacking strategies 2025',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '5-3-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'Maximising Your Interest',
                      questions: [
                        {
                          concept: 'Interest stacking',
                          question: 'A student earns $1,800/month from a part-time internship and spends $450/month on a UOB card. Their UOB One account requires $500/month card spend. What is the best way to hit the threshold?',
                          options: [
                            'Spend an extra $50 on discretionary items to push card spend over $500',
                            'Switch to OCBC 360 which has no card spend minimum',
                            'Move Netflix, Spotify, and phone plan payments to the UOB card — spending that\'s already happening',
                            'Top up GrabPay from the UOB card to artificially inflate the spend count',
                          ],
                          correctIndex: 2,
                          explanation: 'Consolidating existing subscriptions costs nothing and adds $30–$80 in qualifying spend — no extra outlay required. Never manufacture spending just to chase a bonus tier; the interest earned rarely outweighs the extra cost.',
                        },
                        {
                          concept: 'Automation',
                          question: 'A student manually transfers their salary from DBS to their OCBC 360 every payday. Why is this a problem — and what\'s the fix?',
                          options: [
                            'It\'s not a problem — manual transfers count the same as payroll GIRO for salary credit',
                            'It\'s a problem because OCBC charges a fee for incoming transfers; fix by switching to UOB',
                            'It\'s a problem because manual transfers may not be recognised as salary credit, and a missed month costs the biggest bonus tier — fix by updating payroll GIRO through HR',
                            'It\'s a problem because DBS blocks transfers to competitor banks; fix by using PayNow instead',
                          ],
                          correctIndex: 2,
                          explanation: 'Banks typically require salary to arrive via payroll GIRO labelled as salary. A manual transfer may not qualify — and any month it\'s forgotten, the biggest bonus tier is lost. One HR form fixes this permanently.',
                        },
                        {
                          concept: 'Annual review',
                          question: 'A student checks their OCBC 360 at year-end and realises their effective rate has been 0.8% for the past 6 months — well below the 3.5% they expected. What is the most likely cause?',
                          options: [
                            'OCBC 360 reduced its base rate — nothing can be done',
                            'The student met the conditions when they set up the account but OCBC changed its conditions mid-year — a review would have caught this months earlier',
                            'The student\'s balance exceeded the cap, so the higher rate no longer applied to any of their money',
                            'Interest is only applied annually, so the 0.8% is normal until December',
                          ],
                          correctIndex: 1,
                          explanation: 'Banks update HYSA conditions regularly. A student who set up conditions 18 months ago and never reviewed may be meeting outdated tiers while missing new ones. A 30-minute annual review catches exactly this — and on a $15,000 balance, 2.7% in missed interest is $405/year.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'What is interest stacking?',
                  a: 'Deliberately structuring your behaviour — salary credit, card spend, GIRO — to meet multiple HYSA bonus tiers simultaneously and maximise your effective rate.',
                },
                {
                  q: 'What is the single most valuable HYSA condition to meet?',
                  a: 'Salary credit — it unlocks the biggest bonus tier (1–3% p.a.) across all three major HYSAs. Always credit your salary to your HYSA bank via payroll GIRO.',
                },
                {
                  q: 'How do you hit the card spend threshold without spending more money?',
                  a: 'Consolidate existing spending — groceries, transport, subscriptions — onto your HYSA\'s linked card. Route what you already spend through one card.',
                },
                {
                  q: 'Why should you do an annual HYSA review?',
                  a: 'Banks change conditions and rates regularly. A 30-minute review can identify missed conditions or better alternatives — on $20,000, finding 1% more is worth $200/year.',
                },
                {
                  q: 'What is the easiest HYSA condition to automate permanently?',
                  a: 'GIRO payments — set up your phone bill, utilities, and insurance to deduct from your HYSA once, and they qualify automatically every month.',
                },
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
            // ── LESSON 6-1 ──────────────────────────────
            {
              id: '6-1',
              title: 'Singapore Savings Bonds Explained',
              icon: '🇸🇬',
              topic: 'Singapore Savings Bond SSB how it works',
              duration: '6 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'what',
                  title: 'What Are SSBs?',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'What Are SSBs?',
                    },
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
                      type: 'subheading',
                      text: 'SSBs vs Fixed Deposits vs HYSAs',
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
                      type: 'bot',
                      label: '💬 Current SSB interest rates and latest tranche details',
                      prompt: 'Singapore Savings Bond current interest rates latest tranche allotment results MAS 2025',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '6-1-s1-tinder',
                      fincoins: 10,
                      title: 'Singapore Savings Bonds — True or False?',
                      instruction: 'Swipe right for True · Swipe left for False',
                      statements: [
                        {
                          text: 'SSBs are issued by the Singapore government and carry zero default risk.',
                          isTrue: true,
                          explanation: 'SSBs are backed by the full faith and credit of the Singapore government — the same entity that has never defaulted on a financial obligation in over 50 years of independence.',
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
                          text: 'You can invest an unlimited amount in SSBs — there is no maximum per person.',
                          isTrue: false,
                          explanation: 'Each person can hold a maximum of $200,000 in SSBs at any one time. For most students this is not a constraint, but it\'s worth knowing the limit exists.',
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'how',
                  title: 'How to Apply',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'How to Apply',
                    },
                    {
                      type: 'text',
                      text: 'Buying an SSB is straightforward — but there are a few steps to set up before your first application. Most students can complete the full setup in under a week.',
                    },
                    {
                      type: 'steps',
                      steps: [
                        'Open a CDP (Central Depository) account at SGX — free to open, takes 3–5 business days. A CDP account is required to hold SSBs.',
                        'Link your CDP account to your bank account via internet banking — DBS, OCBC, or UOB. This is where interest payments and redemption proceeds will be credited.',
                        'Check the current month\'s SSB tranche on the MAS website — note the interest rate schedule and application closing date.',
                        'Apply via your bank\'s internet banking or ATM — select "Singapore Savings Bonds" and enter your desired amount. Minimum is $500, in multiples of $500.',
                        'Wait for allotment results — announced after the application closes. If the tranche is oversubscribed, you may receive less than requested. You are never charged for the unallotted amount.',
                        'Interest is credited to your linked bank account every 6 months automatically — no action required.',
                      ],
                    },

                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: SSBs are frequently oversubscribed — especially in months with attractive rates. Apply for slightly more than you want, as allotment may be less than your full request. You are never charged for the unallotted amount.',
                    },
                    {
                      type: 'subheading',
                      text: 'Common SSB Misconceptions',
                    },
                    {
                      type: 'flipcards',
                      variant: 'reframe',
                      title: 'Common misconceptions → the reality:',
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
                          back: 'SSBs are specifically designed for retail investors with no investment experience. No market risk, no price fluctuation, no complex terms — you put in $500 and get back $500 plus interest.',
                          tag: 'Simplest investment product in Singapore',
                        },
                        {
                          frontLabel: '❌ Misconception',
                          backLabel: '✅ Reality',
                          front: '"I should wait for interest rates to go up before buying an SSB."',
                          back: 'Trying to time SSB rates is counterproductive — money sitting in a 0.05% savings account while you wait is losing value. Apply now and redeem and reapply if rates improve significantly.',
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
                      type: 'bot',
                      label: '💬 How do I open a CDP account and apply for an SSB as an international student in Singapore?',
                      prompt: 'how to open CDP account Singapore SGX apply Singapore Savings Bond international student steps 2025',
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'when',
                  title: 'When SSBs Make Sense',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'When SSBs Make Sense',
                    },
                    {
                      type: 'text',
                      text: 'SSBs aren\'t the right tool for every situation — but when the conditions are right, they\'re hard to beat. Here\'s how to think about when to use them.',
                    },
                    {
                      type: 'subheading',
                      text: 'SSB vs Your Other Options',
                    },
                    {
                      type: 'topiccards',
                      cards: [
                        {
                          icon: '✅',
                          label: 'SSBs Work Best When...',
                          description: 'You have a lump sum you don\'t need for at least 1–2 months',
                          color: '#059669',
                          details: [
                            'You have savings above your emergency fund that are just sitting in a basic account',
                            'You want a safe, no-conditions alternative to an HYSA for excess savings',
                            'You\'ve received a windfall (ang bao, bonus, bursary) and won\'t need it for 12+ months',
                            'You want a government-backed instrument with no market risk whatsoever',
                          ],
                          example: '$5,000 sitting unused in a basic savings account → move to SSB, earn ~$150/year with zero risk and full flexibility.',
                        },
                        {
                          icon: '⚠️',
                          label: 'SSBs Are Less Ideal When...',
                          description: 'You need instant access or expect to use the money within weeks',
                          color: '#D97706',
                          details: [
                            'You need truly instant liquidity — SSB redemption takes up to one month to process',
                            'Your HYSA is fully optimised and earning 4%+ — the SSB rate may be lower',
                            'The money is your primary emergency fund — always keep at least 1 month of expenses in an instantly liquid account',
                            'You\'re actively investing and need flexibility to deploy capital quickly',
                          ],
                          example: 'Your $1,000 emergency buffer should stay in a liquid account — not an SSB where a one-month redemption window could leave you stuck.',
                        },
                      ],
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '6-1-s3-scenarios',
                      fincoins: 10,
                      title: 'Does an SSB make sense here?',
                      scenarios: [
                        {
                          icon: '🛡️',
                          situation: 'You\'ve built a $3,000 emergency fund sitting in a basic savings account earning 0.05%. You\'re unlikely to need it in the next few months.',
                          options: [
                            {
                              text: 'Keep it all in the basic savings account — it\'s already set up and accessible.',
                              biasLabel: 'Costly inaction',
                              biasExplanation: 'On $3,000 at 0.05%, you earn $1.50/year. An SSB at ~3% earns $90/year — with similar flexibility. There\'s no reason to leave funds in a basic account when better options exist.',
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
                              text: 'Apply for an SSB with the full $800 — minimum is $500, in multiples of $500.',
                              biasLabel: 'Best use of a windfall ✓',
                              biasExplanation: 'A lump sum you won\'t need for 12+ months is exactly what SSBs are designed for. Government-backed, ~3% p.a., redeemable if plans change. Perfect windfall vehicle.',
                              isIdeal: true,
                            },
                            {
                              text: 'Wait and save until you have $5,000 before investing.',
                              biasLabel: 'Opportunity cost',
                              biasExplanation: 'There\'s no reason to wait — SSBs accept from $500. Every month you wait, your $800 earns nothing. Apply now and add to a new tranche when you have more.',
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
                              biasExplanation: 'When rates are equal, flexibility always wins. The SSB gives you the same return as the fixed deposit but lets you exit without penalty if plans change — a free option.',
                              isIdeal: true,
                            },
                            {
                              text: 'Split $2,500 into each — diversify between the two products.',
                              biasLabel: 'Unnecessary complexity',
                              biasExplanation: 'Both products carry minimal risk. Splitting adds no meaningful diversification benefit — when rates are equal, the SSB\'s flexibility makes it the better choice for the full amount.',
                              isIdeal: false,
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: SSB interest rates are fixed at the time you buy — new tranches may be higher or lower. If rates rise significantly, redeem your existing SSB (no penalty) and reinvest in the new higher-rate tranche.',
                    },
                    {
                      type: 'bot',
                      label: '💬 How do SSBs compare to fixed deposits and HYSAs for students in Singapore right now?',
                      prompt: 'Singapore Savings Bond vs fixed deposit vs HYSA comparison students Singapore 2025 rates',
                    },
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: Singapore Savings Bonds Explained',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on what SSBs are, how to apply, and when they make more sense than the alternatives.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — key facts about Singapore Savings Bonds?',
                      prompt: 'Singapore Savings Bond key facts summary eligibility interest how to buy 2025',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '6-1-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'Singapore Savings Bonds Explained',
                      questions: [
                        {
                          concept: 'SSB fundamentals',
                          question: 'A student says "I\'m not buying an SSB — I\'ll lose access to my money for 10 years." What\'s the accurate response?',
                          options: [
                            'They\'re correct — SSBs require a 10-year commitment before any redemption is allowed',
                            'SSBs can be redeemed in any month with no penalty — the 10-year tenor is the maximum holding period, not a lock-in',
                            'SSBs can only be redeemed after 1 year — there is a 12-month minimum holding period',
                            'Early redemption is allowed but attracts a 1% penalty fee on the principal',
                          ],
                          correctIndex: 1,
                          explanation: 'The 10-year tenor is the maximum, not a commitment. SSBs can be redeemed in any month with no penalty — you keep all interest earned up to that point. Think of it as a flexible savings account that rewards patience.',
                        },
                        {
                          concept: 'Eligibility and setup',
                          question: 'What does an international student need to buy their first SSB in Singapore?',
                          options: [
                            'A Singapore PR status and a minimum $5,000 to invest',
                            'A CDP account linked to a local bank account — available to all Singapore residents aged 18+ including student pass holders',
                            'A brokerage account and a minimum 12-month proof of residency',
                            'SSBs are only available to Singapore citizens — international students are not eligible',
                          ],
                          correctIndex: 1,
                          explanation: 'SSBs are open to all Singapore residents aged 18 and above — including international students on a valid student pass. The only requirements are a CDP account (free to open at SGX) and a local bank account.',
                        },
                        {
                          concept: 'SSB vs alternatives',
                          question: 'A student has $4,000 in excess savings beyond their emergency fund. Their HYSA is earning only 0.05% base rate (no conditions met). What is the most financially sound move?',
                          options: [
                            'Leave it in the HYSA — the account is already set up and convenient',
                            'Invest it in the stock market for better long-term returns',
                            'Put it in a 12-month fixed deposit — guaranteed return and no risk',
                            'Apply for an SSB — earns ~3% p.a. with no conditions, no market risk, and penalty-free redemption',
                          ],
                          correctIndex: 3,
                          explanation: 'With the HYSA only earning the 0.05% base rate, an SSB at ~3% earns $120/year on $4,000 — for zero effort and zero risk. It\'s more flexible than a fixed deposit (no lock-in) and has no conditions to maintain like an HYSA.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'Who issues Singapore Savings Bonds?',
                  a: 'The Singapore government via MAS — they carry zero default risk and are the safest retail investment instrument in Singapore.',
                },
                {
                  q: 'What is the minimum investment for an SSB?',
                  a: '$500, in multiples of $500. The maximum any one person can hold is $200,000.',
                },
                {
                  q: 'Can you redeem an SSB before the 10-year tenor ends?',
                  a: 'Yes — SSBs can be redeemed in any month with no penalty. You keep all interest earned up to the point of redemption.',
                },
                {
                  q: 'How is SSB interest paid?',
                  a: 'Every 6 months, directly credited to your linked bank account — no action needed on your part.',
                },
                {
                  q: 'Are international students in Singapore eligible to buy SSBs?',
                  a: 'Yes — SSBs are available to all Singapore residents aged 18 and above, including those on a valid student pass.',
                },
              ],
            },
            // ── LESSON 6-2 ──────────────────────────────
            {
              id: '6-2',
              title: 'Fixed Deposits in Singapore',
              icon: '🔒',
              topic: 'Fixed deposit Singapore banks rates comparison',
              duration: '5 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'what',
                  title: 'How Fixed Deposits Work',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'How Fixed Deposits Work',
                    },
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
                          examples: ['Rate fixed at placement', 'Immune to rate cuts', 'Miss rate rises'],
                          details: [
                            'Your interest rate is fixed at the time you place the deposit — market rate changes after that date do not affect your FD.',
                            'This is both a strength and a weakness: if rates rise after you lock in, you miss out. If rates fall, you\'re protected.',
                            'FD rates are quoted per annum — a 3% p.a. rate on a 6-month FD earns approximately 1.5% for that 6-month period.',
                          ],
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
                      type: 'bot',
                      label: '💬 Current fixed deposit rates across Singapore banks',
                      prompt: 'current fixed deposit interest rates DBS OCBC UOB Singapore 2025 comparison best rates',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '6-2-s1-tinder',
                      fincoins: 10,
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
                          text: 'When a fixed deposit auto-renews, it renews at the same interest rate as the original deposit.',
                          isTrue: false,
                          explanation: 'Auto-renewal applies the prevailing rate at the time of renewal — which may be significantly lower or higher than your original rate. Always review before maturity and instruct the bank accordingly.',
                        },
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'rates',
                  title: 'Current Rates',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Current Rates',
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
                      type: 'callout',
                      variant: 'tip',
                      text: 'Singapore Tip: Finance companies like Sing Investments & Finance often offer higher FD rates than the big three banks — but require higher minimums ($5,000–$10,000) and are SDIC-insured separately. Worth checking if you have a larger lump sum.',
                    },
                    {
                      type: 'subheading',
                      text: 'How Much Could You Earn?',
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
                      type: 'subheading',
                      text: 'Common FD Mistakes',
                    },
                    {
                      type: 'flipcards',
                      variant: 'reframe',
                      title: 'Common FD mistakes → what to do instead:',
                      cards: [
                        {
                          frontLabel: '❌ Mistake',
                          backLabel: '✅ Fix',
                          front: 'Locking money in a 12-month FD without being certain you won\'t need it early.',
                          back: 'Only commit to an FD term you\'re 100% confident about. If there\'s any chance you\'ll need early access, use an SSB instead — same rate, no penalty for early exit.',
                          tag: 'Uncertain timeline = use SSB',
                        },
                        {
                          frontLabel: '❌ Mistake',
                          backLabel: '✅ Fix',
                          front: 'Letting your FD auto-renew without checking the new rate first.',
                          back: 'Set a calendar reminder 1 week before your FD matures. Auto-renewal at a lower rate is one of the most common and avoidable FD mistakes.',
                          tag: 'Always review before maturity',
                        },
                        {
                          frontLabel: '❌ Mistake',
                          backLabel: '✅ Fix',
                          front: 'Assuming a 3% p.a. FD earns 3% of your deposit for any term.',
                          back: 'Rates are quoted per annum. A 3% p.a. rate on a 6-month FD earns ~1.5% for that period. Always calculate the actual dollar return for your specific term.',
                          tag: 'p.a. = per year, not per term',
                        },
                      ],
                    },
                    {
                      type: 'bot',
                      label: '💬 Which Singapore bank has the best fixed deposit rates right now?',
                      prompt: 'best fixed deposit rates Singapore DBS OCBC UOB GXS Trust finance companies 2025 comparison',
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'vs',
                  title: 'FD vs SSB vs HYSA',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'FD vs SSB vs HYSA',
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
                      type: 'subheading',
                      text: 'Which Instrument Suits Your Situation?',
                    },
                    {
                      type: 'topiccards',
                      cards: [
                        {
                          icon: '🔒',
                          label: 'Fixed Deposit',
                          description: 'Best for committed lump sums with a known horizon',
                          color: '#4F46E5',
                          details: [
                            'Guaranteed rate locked in at placement — immune to rate cuts during the term',
                            'No conditions to meet — the rate is unconditional',
                            'Zero flexibility — early withdrawal forfeits all interest',
                          ],
                          example: 'Best for: $5,000 saved from internship, parked for exactly 6 months while you focus on studies — known timeline, no chance of needing it early.',
                        },
                        {
                          icon: '🇸🇬',
                          label: 'Singapore Savings Bond',
                          description: 'Best for flexible lump sums without a fixed timeline',
                          color: '#059669',
                          details: [
                            'Government-backed — zero default risk, higher guarantee than any bank deposit',
                            'Redeem any month with no penalty — flexibility without sacrificing safety',
                            'Step-up interest rewards long-term holding but doesn\'t penalise early exit',
                          ],
                          example: 'Best for: emergency fund top-up, ang bao windfalls, or any lump sum where you want competitive rates but might need access within 12 months.',
                        },
                        {
                          icon: '🏦',
                          label: 'HYSA',
                          description: 'Best for active savers who consistently meet conditions',
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
                      type: 'bot',
                      label: '💬 Should I put my savings in a fixed deposit, SSB, or HYSA in Singapore right now?',
                      prompt: 'fixed deposit vs Singapore Savings Bond vs HYSA comparison which is better students Singapore 2025',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '6-2-s3-scenarios',
                      fincoins: 10,
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
                              biasExplanation: 'An SSB is reasonable given its flexibility, but SSB redemption takes up to one month to process — cutting it close for a hard 6-month deadline. The FD matures on an exact date.',
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
                              biasExplanation: 'If your HYSA is actively earning bonus interest, this is a solid choice. But if conditions aren\'t met, the SSB\'s unconditional rate easily beats the HYSA base rate of 0.05%.',
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
                              biasExplanation: 'Most HYSAs offer the highest rates on balances up to a certain cap. At $20,000 you\'re likely within that cap — but concentrating everything in one instrument means a missed condition affects all your savings.',
                              isIdeal: false,
                            },
                            {
                              text: 'Keep $10,000 in the HYSA for daily banking and put $10,000 in an SSB.',
                              biasLabel: 'Smart diversification ✓',
                              biasExplanation: 'Splitting across instruments reduces the risk of a missed HYSA condition affecting your full savings. The SSB earns a similar rate unconditionally while the HYSA handles active conditions.',
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
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: Fixed Deposits in Singapore',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on how fixed deposits work, how to calculate FD returns, and when to choose an FD over an SSB or HYSA.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — how do fixed deposits work in Singapore?',
                      prompt: 'how do fixed deposits work Singapore rates terms early withdrawal SDIC 2025 summary',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '6-2-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'Fixed Deposits in Singapore',
                      questions: [
                        {
                          concept: 'How FDs work',
                          question: 'A student places $5,000 in a 6-month fixed deposit at 3% p.a. How much interest will they earn at maturity?',
                          options: [
                            '$150 — 3% of $5,000',
                            '$75 — 3% p.a. for 6 months is 1.5% of $5,000',
                            '$50 — FDs charge a placement fee which reduces the return',
                            '$300 — FD interest compounds monthly',
                          ],
                          correctIndex: 1,
                          explanation: 'FD rates are quoted per annum. A 3% p.a. rate on a 6-month FD earns half the annual rate — 1.5% — which is $75 on a $5,000 deposit. Always calculate for your actual term, not the headline annual rate.',
                        },
                        {
                          concept: 'FD risks',
                          question: 'A student places $8,000 in a 12-month FD. Three months later, an unexpected expense arises and they need $3,000. What is the most likely outcome if they break the FD?',
                          options: [
                            'They can withdraw $3,000 and the remaining $5,000 continues earning interest normally',
                            'They lose only the interest earned on the $3,000 withdrawn — the rest is unaffected',
                            'They forfeit all interest earned on the full $8,000 and may pay an administrative fee',
                            'They pay a 1% early withdrawal penalty on the amount withdrawn only',
                          ],
                          correctIndex: 2,
                          explanation: 'Most Singapore banks treat an FD as a single contract — breaking it early forfeits all interest earned, not just on the portion withdrawn. This is why FDs should only hold money you are 100% certain you won\'t need early.',
                        },
                        {
                          concept: 'FD vs SSB',
                          question: 'A student has $6,000 to save. They might need it within the next year but aren\'t sure exactly when. Both a 12-month FD and an SSB offer ~3% p.a. Which is the better choice and why?',
                          options: [
                            'Fixed deposit — the guaranteed rate makes it safer than an SSB',
                            'SSB — same rate, but redeemable any month with no penalty if plans change',
                            'Fixed deposit — SSBs are only available to Singaporeans, not international students',
                            'Split evenly between both — diversification always reduces risk',
                          ],
                          correctIndex: 1,
                          explanation: 'When rates are equal, flexibility always wins. The SSB gives the same return as the FD but lets you exit any month without penalty — a free option that the FD doesn\'t offer. The FD\'s early exit forfeits all interest, making it the wrong tool for an uncertain timeline.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'What is the main trade-off of a fixed deposit?',
                  a: 'Higher guaranteed interest rate, but your money is locked for the full term — early withdrawal typically forfeits all interest earned.',
                },
                {
                  q: 'How is FD interest calculated for a term shorter than 12 months?',
                  a: 'FD rates are quoted per annum — divide by the fraction of the year. A 3% p.a. rate on a 6-month FD earns approximately 1.5% for that period.',
                },
                {
                  q: 'What happens when a fixed deposit auto-renews?',
                  a: 'It renews at the prevailing rate on the renewal date — which may be lower or higher than your original rate. Always review before maturity.',
                },
                {
                  q: 'When is a fixed deposit a better choice than an SSB?',
                  a: 'When you have a known fixed horizon and are 100% certain you won\'t need the money early — FDs offer an unconditional guaranteed rate with no redemption delay.',
                },
                {
                  q: 'Are fixed deposits in Singapore banks protected by SDIC?',
                  a: 'Yes — FDs at MAS-licensed banks are SDIC-insured up to $75,000 per depositor per bank, the same as savings accounts.',
                },
              ],
            },
            // ── LESSON 6-3 ──────────────────────────────
            {
              id: '6-3',
              title: 'T-Bills & Low-Risk Instruments',
              icon: '📑',
              topic: 'Singapore T-bills treasury bills how to buy',
              duration: '5 min',
              fincoins: 55,
              sections: [

                // ─── SECTION 1 ───────────────────────────
                {
                  key: 'what',
                  title: 'What Are T-Bills?',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'What Are T-Bills?',
                    },
                    {
                      type: 'text',
                      text: 'T-bills are the shortest-term government securities available in Singapore — 6 months or 1 year. Unlike SSBs which pay step-up interest over time, T-bills work differently: you buy them at a discount to their face value and receive the full face value at maturity. The difference between what you pay and what you receive is your return. No monthly interest, no coupons — just buy low, redeem high.',
                    },
                    {
                      type: 'callout',
                      variant: 'fact',
                      text: 'T-bills are issued by MAS and backed by the Singapore government — the same zero default risk as SSBs. The key difference is tenor and mechanic: T-bills are shorter (6 months or 1 year) and sold via auction rather than at a fixed rate.',
                    },
                    {
                      type: 'keyterm',
                      term: 'Treasury Bill (T-Bill)',
                      definition: 'A short-term Singapore government security with a 6-month or 1-year tenor, sold at a discount to its face value of $1. Your return is the difference between the discounted purchase price and the $1 face value received at maturity.',
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
                          examples: ['Held every 2–4 weeks', 'Non-competitive bid recommended', 'Cut-off yield set by market'],
                          details: [
                            'T-bills are sold via auction — buyers submit bids indicating the yield they are willing to accept.',
                            'Competitive bids specify a yield — if your bid yield is higher than the cut-off, you are shut out entirely.',
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
                          tip: 'Your bank account is debited the discounted amount — not the full $1,000. The $17.50 difference is your return, credited at maturity.',
                        },
                        {
                          icon: '🏁',
                          label: 'Maturity',
                          sublabel: 'Receive full face value',
                          color: '#059669',
                          examples: ['Receive exactly $1 per unit', 'Credited to bank account', 'No auto-renewal'],
                          details: [
                            'At maturity — 6 months or 1 year after issuance — you receive the full face value of $1 per unit.',
                            'The maturity proceeds are credited directly to your linked bank account or CPF-OA.',
                            'Unlike FDs, T-bills do not auto-renew — you must actively apply for a new T-bill if you want to reinvest.',
                          ],
                          tip: 'Set a calendar reminder before your T-bill matures — if you want to reinvest, you need to actively apply for the next auction.',
                        },
                      ],
                    },
                    {
                      type: 'subheading',
                      text: 'T-Bill Quick Reference',
                    },
                    {
                      type: 'table',
                      firstColAccent: true,
                      headers: ['Feature', 'Details'],
                      rows: [
                        ['Issued by', 'Monetary Authority of Singapore (MAS)'],
                        ['Tenor', '6 months or 1 year'],
                        ['Minimum investment', '$1,000 (in multiples of $1,000)'],
                        ['How return is paid', 'Discount at purchase — full face value at maturity'],
                        ['Auction frequency', 'Every 2–4 weeks (6-month), monthly (1-year)'],
                        ['CPF-OA eligible', 'Yes — can use CPF Ordinary Account funds'],
                        ['SRS eligible', 'Yes — can use Supplementary Retirement Scheme funds'],
                        ['Default risk', 'Zero — Singapore government backed'],
                        ['Early redemption', 'Not redeemable — secondary market sale only'],
                      ],
                    },
                    {
                      type: 'bot',
                      label: '💬 Current T-bill cut-off yields and upcoming auction dates',
                      prompt: 'Singapore T-bill latest cut-off yield 6-month 1-year upcoming auction dates MAS 2025',
                    },
                    {
                      type: 'tindertruefalse',
                      exerciseId: '6-3-s1-tinder',
                      fincoins: 10,
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
                      ],
                    },
                  ],
                },

                // ─── SECTION 2 ───────────────────────────
                {
                  key: 'apply',
                  title: 'Applying via CPF/Cash',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'Applying via CPF/Cash',
                    },
                    {
                      type: 'text',
                      text: 'One of T-bills\' most distinctive features is that they can be purchased using CPF Ordinary Account (OA) funds — making them one of the few short-term instruments where your CPF savings can earn a competitive market rate. Here\'s how to apply, whether using cash or CPF.',
                    },
                    {
                      type: 'steps',
                      steps: [
                        'Ensure you have a CDP account linked to your bank account (DBS, OCBC, or UOB). The same CDP account used for SSBs works for T-bills.',
                        'Check the upcoming T-bill auction schedule on the MAS website — note the application opening and closing dates.',
                        'Log into your bank\'s internet banking. Navigate to "Investments" or "Singapore Government Securities" and select T-bill application.',
                        'Enter your application amount (minimum $1,000, multiples of $1,000) and select "Non-Competitive Bid" to guarantee allotment at the cut-off yield.',
                        'Choose your funding source — cash (bank account debited) or CPF-OA (CPF account debited the discounted amount).',
                        'Wait for allotment results — announced 1–2 business days after auction closes. Your account is debited the discounted purchase price.',
                        'At maturity, the full face value ($1,000 per unit) is credited to your linked bank account or CPF-OA automatically.',
                      ],
                    },
                    {
                      type: 'callout',
                      variant: 'tip',
                      text: 'Always submit a non-competitive bid. Competitive bids specify a yield — if the auction clears at a lower yield than you specified, your bid is rejected and you receive nothing. Non-competitive bids guarantee allotment at whatever yield the market determines.',
                    },
                    {
                      type: 'subheading',
                      text: 'Common T-Bill Misconceptions',
                    },
                    {
                      type: 'flipcards',
                      variant: 'reframe',
                      title: 'Common misconceptions → the reality:',
                      cards: [
                        {
                          frontLabel: '❌ Misconception',
                          backLabel: '✅ Reality',
                          front: '"I need to know the right yield to bid — T-bills are too complicated for a beginner."',
                          back: 'Submit a non-competitive bid and you automatically receive the cut-off yield. You don\'t need to know anything about yields to participate — just enter your amount and select non-competitive.',
                          tag: 'Non-competitive bids remove all complexity',
                        },
                        {
                          frontLabel: '❌ Misconception',
                          backLabel: '✅ Reality',
                          front: '"I\'m paying a discount upfront — that means I\'m losing money from the start."',
                          back: 'The discount is your return, not a fee. You pay $982.50 for $1,000 face value — at maturity you receive $1,000. The $17.50 difference is interest earned. You are always better off at maturity than at purchase.',
                          tag: 'Discount = your return, not a cost',
                        },
                        {
                          frontLabel: '❌ Misconception',
                          backLabel: '✅ Reality',
                          front: '"I can redeem my T-bill early if I need the money — just like an SSB."',
                          back: 'T-bills cannot be redeemed early through MAS. Early exit requires selling on the secondary market — which may be at a discount and involves transaction fees. Only invest money you won\'t need before maturity.',
                          tag: 'T-bills are not redeemable early',
                        },
                        {
                          frontLabel: '❌ Misconception',
                          backLabel: '✅ Reality',
                          front: '"Using CPF-OA for T-bills always makes sense — it\'s still government-backed money."',
                          back: 'CPF-OA already earns a guaranteed 2.5% p.a. Using it for T-bills only makes sense when the T-bill cut-off yield exceeds 2.5%. Always compare before deploying CPF funds.',
                          tag: 'Only use CPF if T-bill yield > 2.5% p.a.',
                        },
                      ],
                    },
                    {
                      type: 'bot',
                      label: '💬 How do I apply for a T-bill using CPF OA funds in Singapore?',
                      prompt: 'how to apply Singapore T-bill CPF OA funds internet banking steps 2025',
                    },
                  ],
                },

                // ─── SECTION 3 ───────────────────────────
                {
                  key: 'vs',
                  title: 'T-Bills vs SSB vs FD',
                  fincoins: 10,
                  content: [
                    {
                      type: 'heading',
                      text: 'T-Bills vs SSB vs FD',
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
                        ['Return paid', 'Discount at purchase', 'Every 6 months to bank', 'At maturity'],
                        ['Early exit', 'Secondary market only', 'Redeem any month, no penalty', 'Forfeit all interest'],
                        ['CPF-OA eligible', '✅ Yes', '❌ No', '❌ No'],
                        ['SRS eligible', '✅ Yes', '✅ Yes', '✅ Yes'],
                        ['Rate set by', 'Market auction', 'MAS (fixed monthly)', 'Bank (fixed at placement)'],
                        ['Default risk', 'Zero', 'Zero', 'Low (SDIC up to $75k)'],
                        ['Auto-renewal', 'No — manual reapplication', 'No', 'Yes — at prevailing rate'],
                      ],
                    },
                    {
                      type: 'callout',
                      variant: 'fact',
                      text: 'The CPF-OA eligibility column is the key differentiator — T-bills are the only short-term low-risk instrument that lets you deploy CPF Ordinary Account funds at a market-determined rate.',
                    },
                    {
                      type: 'bot',
                      label: '💬 How do T-bills compare to SSBs and fixed deposits in Singapore right now?',
                      prompt: 'Singapore T-bills vs SSB vs fixed deposit comparison rates 2025 which is better students',
                    },
                    {
                      type: 'scenarios',
                      exerciseId: '6-3-s3-scenarios',
                      fincoins: 10,
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
                              biasExplanation: 'A 6-month T-bill aligns with your 7-month horizon, carries zero default risk, and typically offers competitive yields. Just ensure the maturity date falls before you need the funds.',
                              isIdeal: true,
                            },
                            {
                              text: 'Put it in an SSB for flexibility in case plans change.',
                              biasLabel: 'Also reasonable',
                              biasExplanation: 'An SSB is a solid alternative — especially if your timeline might shift. Note that SSB redemption takes up to one month, so plan accordingly if your graduation date is fixed.',
                              isIdeal: false,
                            },
                            {
                              text: 'Place it in a 6-month fixed deposit at the same rate.',
                              biasLabel: 'Similar outcome, less safe',
                              biasExplanation: 'An FD at the same rate is functionally similar — but T-bills are government-backed while FDs rely on SDIC insurance. For the same rate, T-bills carry marginally lower issuer risk.',
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
                  ],
                },

                // ─── SECTION 4 ───────────────────────────
                {
                  key: 'challenge',
                  title: 'Challenge',
                  fincoins: 25,
                  content: [
                    {
                      type: 'heading',
                      text: 'Challenge: T-Bills & Low-Risk Instruments',
                    },
                    {
                      type: 'text',
                      text: 'Three questions on how T-bills work, how to apply, and when to choose them over SSBs or fixed deposits.',
                    },
                    {
                      type: 'bot',
                      label: '💬 Quick recap — key facts about Singapore T-bills?',
                      prompt: 'Singapore T-bills key facts summary how to buy CPF eligible non-competitive bid 2025',
                    },
                    {
                      type: 'multistepmcq',
                      exerciseId: '6-3-s4-mcq',
                      fincoins: 25,
                      icon: '🎯',
                      title: 'T-Bills & Low-Risk Instruments',
                      questions: [
                        {
                          concept: 'How T-bills work',
                          question: 'A student applies for $5,000 face value of a 6-month T-bill at a cut-off yield of 3.6% p.a. Approximately how much is debited from their bank account at allotment?',
                          options: [
                            '$5,000 — you pay the full face value upfront and receive interest separately at maturity',
                            '$4,910 — the discount reflects 3.6% p.a. for 6 months (1.8%) applied to $5,000',
                            '$4,820 — T-bills apply a 1% placement fee on top of the discount',
                            '$5,180 — you pay a premium above face value and receive a rebate at maturity',
                          ],
                          correctIndex: 1,
                          explanation: 'T-bills are sold at a discount. A 3.6% p.a. yield over 6 months is 1.8% — so you pay approximately $5,000 × (1 − 0.018) = $4,910. At maturity you receive the full $5,000. The $90 difference is your return.',
                        },
                        {
                          concept: 'CPF and T-bills',
                          question: 'A student has $8,000 in CPF-OA earning 2.5% p.a. The latest 6-month T-bill cut-off yield is 2.2% p.a. Should they deploy their CPF-OA into the T-bill?',
                          options: [
                            'Yes — T-bills are government-backed so any rate is worth it',
                            'Yes — CPF-OA funds are idle and any additional return is a bonus',
                            'No — the T-bill yield of 2.2% is below the CPF-OA\'s guaranteed 2.5% p.a., so deploying CPF funds would reduce their return',
                            'No — CPF-OA funds cannot be used for T-bills under any circumstances',
                          ],
                          correctIndex: 2,
                          explanation: 'CPF-OA already earns a guaranteed 2.5% p.a. A T-bill yielding only 2.2% would earn less — making it counterproductive to deploy CPF funds. Only use CPF-OA for T-bills when the cut-off yield meaningfully exceeds 2.5%.',
                        },
                        {
                          concept: 'T-bill vs alternatives',
                          question: 'A student needs their $4,000 savings in approximately 6 months. They are comparing a 6-month T-bill vs a 6-month fixed deposit at the same rate. What is the key advantage of the T-bill?',
                          options: [
                            'T-bills pay higher interest than fixed deposits for the same term',
                            'T-bills are backed by the Singapore government while fixed deposits rely on SDIC insurance up to $75,000 — lower issuer risk for the same rate',
                            'T-bills can be redeemed early with no penalty while fixed deposits cannot',
                            'T-bills have no minimum investment while fixed deposits require $10,000',
                          ],
                          correctIndex: 1,
                          explanation: 'At the same rate, T-bills carry marginally lower issuer risk — they are direct government obligations vs bank FDs which are SDIC-insured up to $75,000. For a student with $4,000, both instruments are functionally safe, but T-bills represent the cleaner government guarantee.',
                        },
                      ],
                    },
                  ],
                },
              ],

              flashcards: [
                {
                  q: 'What is a T-bill and how does it generate a return?',
                  a: 'A short-term Singapore government security sold at a discount to face value. You pay less than $1,000 and receive $1,000 at maturity — the difference is your return.',
                },
                {
                  q: 'What is the difference between a competitive and non-competitive T-bill bid?',
                  a: 'A competitive bid specifies a yield and risks being shut out. A non-competitive bid accepts whatever cut-off yield the auction determines and guarantees allotment — always choose non-competitive.',
                },
                {
                  q: 'Can you use CPF Ordinary Account funds to buy T-bills?',
                  a: 'Yes — T-bills are CPF-OA eligible. It only makes sense when the T-bill cut-off yield exceeds the CPF-OA\'s guaranteed rate of 2.5% p.a.',
                },
                {
                  q: 'Can T-bills be redeemed early like SSBs?',
                  a: 'No — T-bills cannot be redeemed early through MAS. Early exit requires selling on the secondary market, which may be at a discount and involves transaction costs.',
                },
                {
                  q: 'When should you choose a T-bill over an SSB?',
                  a: 'When you want a shorter fixed horizon (6 months or 1 year), want to deploy CPF-OA funds, or when T-bill auction yields are more attractive than the current SSB rate.',
                },
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
          // ── LESSON 7-1 ──────────────────────────────
          {
            id: '7-1',
            title: 'Why Invest at All?',
            icon: '🤔',
            topic: 'Why investing beats saving alone',
            duration: '5 min',
            fincoins: 55,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'why',
                title: 'Inflation Erodes Savings',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Inflation Erodes Savings',
                  },
                  {
                    type: 'text',
                    text: 'Saving money is necessary — but it is not enough. A savings account preserves the number in your balance. Investing grows what that number can actually buy. The silent enemy of savings is inflation — and most people don\'t feel its effect until years of purchasing power have already been lost.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Singapore\'s average inflation rate has historically run at 2–3% p.a. A basic savings account earning 0.05% means your money is losing purchasing power every single year — not gaining it.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Real Return',
                    definition: 'Your investment return after subtracting inflation. A savings account earning 0.05% with inflation at 2.5% has a real return of -2.45% — meaning your money buys less every year, even as the balance grows.',
                  },
                  {
                    type: 'timeline',
                    title: 'Why saving alone isn\'t enough:',
                    nodes: [
                      {
                        icon: '📉',
                        label: 'Inflation Erodes',
                        sublabel: 'Your money buys less every year',
                        color: '#DC2626',
                        examples: ['2.5% inflation p.a.', '$10,000 today = ~$7,800 in 10 years', 'Prices rise, savings don\'t'],
                        details: [
                          'Inflation is the rate at which prices rise over time — meaning the same amount of money buys less as years pass.',
                          'At 2.5% inflation, $10,000 today has the purchasing power of approximately $7,800 in 10 years.',
                          'Even if your savings balance stays at $10,000, what it can buy has shrunk by 22%.',
                        ],
                        tip: 'Think of inflation not as prices going up — but as your money\'s value quietly going down. The effect is invisible month to month but devastating over a decade.',
                      },
                      {
                        icon: '🏦',
                        label: 'Saving Alone',
                        sublabel: 'The gap between savings and inflation',
                        color: '#F59E0B',
                        examples: ['Basic account: 0.05% p.a.', 'HYSA (optimised): ~3–4% p.a.', 'Still barely beats inflation'],
                        details: [
                          'A basic savings account at 0.05% does almost nothing to offset inflation — you are falling behind by roughly 2.45% every year.',
                          'Even an optimised HYSA at 3–4% p.a. barely keeps pace with inflation — it preserves purchasing power but does not grow it.',
                          'Saving is essential for liquidity and security — but it cannot build long-term wealth on its own.',
                        ],
                        tip: 'HYSAs are for your emergency fund and short-term goals. For long-term wealth, you need returns that meaningfully outpace inflation — and that means investing.',
                      },
                      {
                        icon: '📈',
                        label: 'Investing Bridges the Gap',
                        sublabel: 'Historical returns outpace inflation',
                        color: '#059669',
                        examples: ['S&P 500: ~10% p.a. historical avg', 'STI: ~7–8% p.a. historical avg', 'Bonds: ~3–5% p.a.'],
                        details: [
                          'Historically, broad market investments have returned 7–10% p.a. on average — significantly outpacing inflation.',
                          'This means invested money doesn\'t just preserve purchasing power — it compounds and grows in real terms over time.',
                          'The risk is that returns are not guaranteed and values fluctuate — but over long horizons, the evidence strongly favours investing over saving alone.',
                        ],
                        tip: 'Investing doesn\'t mean gambling. A diversified, low-cost index fund has historically been one of the most reliable ways to build long-term wealth for ordinary investors.',
                      },
                    ],
                  },
                  {
                    type: 'slider',
                    icon: '📉',
                    title: 'Inflation Erosion vs Investment Growth',
                    description: 'Drag to your current savings amount to see the real value difference after 10 years — inflation at 2.5% p.a. vs invested at an illustrative 7% p.a.',
                    min: 1000,
                    max: 50000,
                    step: 1000,
                    initialValue: 10000,
                    prefix: '$',
                    calculateResult: (amount) => [
                      { label: '😴 Basic savings after 10 yrs (0.05%, 2.5% inflation)', value: `$${Math.round(amount * Math.pow(0.9755, 10)).toLocaleString()}`, color: '#DC2626' },
                      { label: '🏦 HYSA after 10 yrs (3% p.a., 2.5% inflation)', value: `$${Math.round(amount * Math.pow(1.005, 10)).toLocaleString()}`, color: '#F59E0B' },
                      { label: '📈 Invested after 10 yrs (illustrative 7% p.a.)', value: `$${Math.round(amount * Math.pow(1.07, 10)).toLocaleString()}`, color: '#059669' },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Current Singapore inflation rate and average savings account rate',
                    prompt: 'current Singapore inflation rate CPI 2025 and average savings account interest rate comparison',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '7-1-s1-tinder',
                    fincoins: 10,
                    title: 'Investing vs Saving — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'Keeping money in a basic savings account at 0.05% is completely risk-free.',
                        isTrue: false,
                        explanation: 'It is free of market risk — but not inflation risk. At 0.05% with 2.5% inflation, your real return is -2.45% per year. Inflation risk is real and guaranteed; market risk is variable.',
                      },
                      {
                        text: 'A savings account with a 3% interest rate beats inflation if Singapore\'s inflation rate is 2.5% p.a.',
                        isTrue: true,
                        explanation: 'A 3% savings rate with 2.5% inflation gives a real return of +0.5% — your purchasing power is growing, just slowly. This is why optimised HYSAs matter even before you invest.',
                      },
                      {
                        text: 'Broad market investments like the S&P 500 have historically returned around 10% p.a. on average.',
                        isTrue: true,
                        explanation: 'The S&P 500 has historically averaged approximately 10% p.a. including dividends — significantly outpacing both inflation and savings account rates over long horizons.',
                      },
                      {
                        text: 'Investing always requires a large lump sum — you need at least $1,000 to start in Singapore.',
                        isTrue: false,
                        explanation: 'Many Singapore platforms — including robo-advisors like Syfe and StashAway — allow you to start with as little as $1. The barrier to entry for investing has never been lower.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'power',
                title: 'The Power of Compounding',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'The Power of Compounding',
                  },
                  {
                    type: 'text',
                    text: 'Compounding is the mechanism that makes investing transformative rather than merely additive. When your returns generate their own returns, growth becomes exponential — not linear. The longer you let it run, the more dramatic the difference.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Compound Growth',
                    definition: 'Growth where returns are reinvested and themselves generate returns. Unlike simple interest — which grows linearly — compound growth accelerates over time, making the early years of investing disproportionately valuable.',
                  },
                  {
                    type: 'slider',
                    icon: '📈',
                    title: 'Compounding Over Time',
                    description: 'Drag to your investment amount to see compound growth at 7% p.a. across different time horizons.',
                    min: 1000,
                    max: 50000,
                    step: 1000,
                    initialValue: 10000,
                    prefix: '$',
                    calculateResult: (amount) => [
                      { label: '⏱️ After 10 years (7% p.a.)', value: `$${Math.round(amount * Math.pow(1.07, 10)).toLocaleString()}`, color: '#6B7280' },
                      { label: '⏱️ After 20 years (7% p.a.)', value: `$${Math.round(amount * Math.pow(1.07, 20)).toLocaleString()}`, color: '#0891B2' },
                      { label: '⏱️ After 30 years (7% p.a.)', value: `$${Math.round(amount * Math.pow(1.07, 30)).toLocaleString()}`, color: '#4F46E5' },
                      { label: '⏱️ After 40 years (7% p.a.)', value: `$${Math.round(amount * Math.pow(1.07, 40)).toLocaleString()}`, color: '#059669' },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: '$10,000 invested at 7% p.a.: after 10 years → $19,672. After 20 years → $38,697. After 40 years → $149,745. The same money, 15x larger — without adding a single dollar. That is compounding.',
                  },
                  {
                    type: 'subheading',
                    text: 'Why Early Years Are Disproportionately Valuable',
                  },
                  {
                    type: 'flipcards',
                    variant: 'reframe',
                    title: 'Biases that stop people from investing:',
                    cards: [
                      {
                        frontLabel: '⏰ Present Bias',
                        backLabel: '💡 The reality',
                        front: '"I\'ll start investing next year" — valuing present comfort over future gain.',
                        back: 'Every year you delay is compounding you never get back. $10,000 at 25 grows to ~$76,000 by 65 at 7% p.a. Wait until 35 and you get only ~$38,000 — half as much from one decade of delay.',
                        tag: 'One decade = half the final value',
                      },
                      {
                        frontLabel: '😰 Loss Aversion',
                        backLabel: '💡 The reality',
                        front: 'Losses feel twice as painful as equivalent gains feel good — so potential losses loom larger than potential returns.',
                        back: 'Not investing is also a choice with a guaranteed cost: inflation. The question is not "what if I lose money?" — it\'s "what is the cost of doing nothing?" Over 10 years, that cost is enormous.',
                        tag: 'Inaction has a guaranteed cost',
                      },
                      {
                        frontLabel: '🌈 Optimism Bias',
                        backLabel: '💡 The reality',
                        front: '"My savings account is fine for now — I\'ll worry about investing when I have more money."',
                        back: 'There is no minimum amount required to start. Many platforms allow you to invest from $1. Waiting until you have "enough" means the best compounding years pass unused.',
                        tag: 'No minimum needed to start',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 CPF interest rates and historical Singapore and US market returns',
                    prompt: 'CPF OA SA interest rates 2025 Singapore STI historical returns S&P 500 average annual return comparison',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '7-1-s2-scenarios',
                    fincoins: 10,
                    title: 'What would you do?',
                    scenarios: [
                      {
                        icon: '⏰',
                        situation: 'You have $5,000 in savings. You\'re deciding whether to start investing now or wait 2 years until you feel "more ready" and have read more about it.',
                        options: [
                          {
                            text: 'Wait 2 years — you\'ll be more informed and confident before committing.',
                            biasLabel: 'Present bias + 2 lost years',
                            biasExplanation: 'At 7% p.a., $5,000 invested today grows to ~$5,725 in 2 years. Waiting means that $725 in compounding is gone permanently — and the gap widens every year you delay.',
                            isIdeal: false,
                          },
                          {
                            text: 'Start with a small amount now — even $500 — in a low-cost index fund, and continue learning.',
                            biasLabel: 'Best approach ✓',
                            biasExplanation: 'Starting small removes the paralysis of perfection. You begin compounding immediately, learn from real experience, and can scale up as your confidence grows. The best time to start was yesterday — the second best is now.',
                            isIdeal: true,
                          },
                          {
                            text: 'Put all $5,000 in an HYSA first until you decide — at least you\'re earning something.',
                            biasLabel: 'Better than nothing, but suboptimal',
                            biasExplanation: 'An HYSA at 3% preserves purchasing power but barely outpaces inflation. Over 20 years, the difference between 3% and 7% on $5,000 is approximately $13,000. Time is the resource you can\'t buy back.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '📉',
                        situation: 'You invested $3,000 six months ago. The market has dropped 15% and your portfolio is now worth $2,550. A friend says "I told you investing was risky — just keep cash."',
                        options: [
                          {
                            text: 'Sell everything — your friend is right, and you can\'t afford to lose more.',
                            biasLabel: 'Loss aversion in action',
                            biasExplanation: 'Selling after a drop locks in the loss permanently. Market drawdowns are normal — the S&P 500 has recovered from every historical decline. Selling at the bottom is how temporary losses become permanent ones.',
                            isIdeal: false,
                          },
                          {
                            text: 'Hold — short-term volatility is normal for long-horizon investing, and you haven\'t actually lost anything yet.',
                            biasLabel: 'Correct approach ✓',
                            biasExplanation: 'A paper loss is only a real loss if you sell. Long-term investors who stayed invested through historical crashes recovered fully and went on to compound significantly. Your time horizon determines your risk tolerance.',
                            isIdeal: true,
                          },
                          {
                            text: 'Invest more now — it\'s on sale.',
                            biasLabel: 'Directionally right, but context matters',
                            biasExplanation: 'Buying more during a dip (dollar-cost averaging) is a legitimate strategy — but only if you have the cash to spare and won\'t need it soon. Don\'t invest emergency funds or money with a short horizon.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '💸',
                        situation: 'You\'ve just received a $2,000 bursary top-up. You already have a 3-month emergency fund and no high-interest debt. What\'s the best use of this windfall?',
                        options: [
                          {
                            text: 'Add it to your HYSA emergency fund to grow it to 6 months of expenses.',
                            biasLabel: 'Good if your fund isn\'t full',
                            biasExplanation: 'If you only have 3 months of emergency savings, building to 6 months is a reasonable priority. But if 3 months is your deliberate target, putting all $2,000 in a savings account misses a compounding opportunity.',
                            isIdeal: false,
                          },
                          {
                            text: 'Invest it in a low-cost index fund — your emergency fund is already covered.',
                            biasLabel: 'Best use of a windfall ✓',
                            biasExplanation: 'With emergency fund covered and no high-interest debt, investing is the highest-return use of a windfall you won\'t need soon. At 7% p.a., $2,000 grows to ~$7,740 in 20 years — without adding another dollar.',
                            isIdeal: true,
                          },
                          {
                            text: 'Spend it — you\'ve been frugal and deserve a treat.',
                            biasLabel: 'Present bias + lost compounding',
                            biasExplanation: 'Spending a windfall when your financial foundations are solid is a valid choice — but recognise the trade-off. $2,000 spent today is $7,740 you won\'t have in 20 years. Balance enjoyment with awareness.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'start',
                title: 'Starting Early',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Starting Early',
                  },
                  {
                    type: 'text',
                    text: 'The single most impactful investing decision you will ever make is not which stock to pick or which fund to choose — it\'s when you start. Time in the market is the one variable that cannot be bought, borrowed, or recovered.',
                  },
                  {
                    type: 'subheading',
                    text: 'The Cost of Waiting',
                  },
                  {
                    type: 'table',
                    headers: ['Start Age', 'Monthly Investment', 'Total Invested', 'Value at 65 (7% p.a.)'],
                    rows: [
                      ['22 (now)', '$200/month', '$103,200 over 43 yrs', '~$580,000'],
                      ['32 (10 yrs later)', '$200/month', '$79,200 over 33 yrs', '~$277,000'],
                      ['42 (20 yrs later)', '$200/month', '$55,200 over 23 yrs', '~$123,000'],
                      ['52 (30 yrs later)', '$200/month', '$31,200 over 13 yrs', '~$46,000'],
                    ],
                    firstColAccent: true,
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'Starting at 22 vs 32 — same $200/month, same 7% p.a. — produces more than double the final value ($580,000 vs $277,000). The extra decade costs only $24,000 more in total contributions but generates over $300,000 more in wealth.',
                  },
                  {
                    type: 'subheading',
                    text: 'What "Starting Small" Actually Looks Like',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '📱',
                        label: 'Robo-Advisors',
                        description: 'Start from $1 — fully automated, diversified portfolios',
                        color: '#4F46E5',
                        details: [
                          'Platforms like Syfe, StashAway, and Endowus invest your money into diversified portfolios automatically',
                          'No investment knowledge required — set a risk level and contribute regularly',
                          'Low fees (typically 0.2–0.65% p.a.) vs traditional fund managers (1.5–2.5% p.a.)',
                        ],
                        example: 'Start with $100/month via Syfe Core. It automatically rebalances and reinvests dividends — compounding without any manual action.',
                      },
                      {
                        icon: '📊',
                        label: 'Regular Shares Savings (RSS)',
                        description: 'Buy index funds monthly from as little as $100',
                        color: '#0891B2',
                        details: [
                          'RSS plans (via DBS, OCBC, or FSMOne) let you buy index ETFs on a fixed monthly schedule',
                          'Dollar-cost averaging — you buy more units when prices are low and fewer when prices are high',
                          'Low minimum ($100/month) and no timing decisions required',
                        ],
                        example: '$100/month into the Nikko AM Singapore STI ETF via OCBC Blue Chip Investment Plan — automatic exposure to Singapore\'s top 30 companies.',
                      },
                      {
                        icon: '💹',
                        label: 'CPF Investment Scheme (CPFIS)',
                        description: 'Invest CPF-OA funds above $20,000 in eligible instruments',
                        color: '#059669',
                        details: [
                          'CPF-OA funds above $20,000 can be invested in eligible unit trusts, ETFs, and stocks via CPFIS',
                          'Returns must exceed the CPF-OA\'s 2.5% p.a. guaranteed rate to be worthwhile',
                          'Low-cost index funds via CPFIS can compound CPF savings significantly over a working lifetime',
                        ],
                        example: 'If your CPF-OA exceeds $20,000, consider investing the excess in a low-cost global index fund via CPFIS — but only if your investment horizon is 10+ years.',
                      },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: You don\'t need to choose between saving and investing. The framework is: emergency fund first (3–6 months in HYSA/SSB) → then invest regularly from whatever is left. Even $50–$100/month invested consistently from age 22 compounds into meaningful wealth by retirement.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Best platforms to start investing in Singapore with a small amount',
                    prompt: 'best platforms to start investing Singapore small amount students robo-advisors ETFs 2025 Syfe StashAway FSMOne',
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Why Invest at All?',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on inflation\'s real cost, the power of compounding, and what the data says about starting early.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — why does investing matter more than saving alone?',
                    prompt: 'why investing beats saving alone inflation real return compounding Singapore 2025 summary',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '7-1-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Why Invest at All?',
                    questions: [
                      {
                        concept: 'Real return and inflation',
                        question: 'A student has $10,000 in a basic savings account earning 0.05% p.a. Singapore\'s inflation rate is 2.5%. What is their real return?',
                        options: [
                          '+2.55% — savings rate plus inflation combined',
                          '+0.05% — whatever the account earns is the real return',
                          '-2.45% — their purchasing power is shrinking by roughly 2.45% per year',
                          '0% — savings accounts are inflation-neutral',
                        ],
                        correctIndex: 2,
                        explanation: 'Real return = nominal return minus inflation. 0.05% − 2.5% = −2.45%. Their balance grows by $5/year while the purchasing power of that $10,000 shrinks by ~$245/year. The number goes up but what it buys goes down.',
                      },
                      {
                        concept: 'Power of compounding',
                        question: 'Two students each invest $10,000 at 7% p.a. Student A starts at age 22 and Student B starts at age 32. Neither adds any more money. Approximately how much more does Student A have at age 65?',
                        options: [
                          'About $7,000 more — the extra 10 years adds roughly $700/year',
                          'About $38,000 more — the same as 10 years of 7% returns on $10,000',
                          'About $57,000 more — compounding on the early base nearly doubles the outcome',
                          'They end up with the same amount — 10 years is negligible over a 40-year horizon',
                        ],
                        correctIndex: 2,
                        explanation: 'Student A: $10,000 × (1.07)^43 ≈ $149,000. Student B: $10,000 × (1.07)^33 ≈ $76,000. The 10-year head start generates roughly $73,000 more — nearly double — from the same initial investment. That is the exponential nature of compounding.',
                      },
                      {
                        concept: 'Starting early',
                        question: 'A student says "I\'ll start investing at 32 — I\'ll invest twice as much per month to make up for lost time." Can they fully compensate for the 10-year delay by doubling their monthly contribution?',
                        options: [
                          'Yes — doubling contributions fully compensates for 10 lost years',
                          'No — they can get close, but they\'ll need to contribute significantly more than double to match the same final value',
                          'Yes — the maths works out exactly: 10 fewer years × 2x contributions = same result',
                          'No — it\'s impossible to catch up once you\'ve missed 10 years of compounding',
                        ],
                        correctIndex: 1,
                        explanation: 'Doubling contributions helps but doesn\'t fully close the gap. The lost 10 years represent lost compounding on every dollar invested — not just the principal. To match the same final value, the later starter typically needs to contribute significantly more than 2x, or accept a lower final amount.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'What is real return and why does it matter?',
                a: 'Real return is your investment return minus inflation. A savings account at 0.05% with 2.5% inflation has a real return of -2.45% — your money buys less every year.',
              },
              {
                q: 'Why does starting to invest early matter so much?',
                a: 'Compounding is exponential — early years generate the base that later years multiply. A 10-year delay can roughly halve your final portfolio value even with the same amount invested.',
              },
              {
                q: 'What is present bias and how does it affect investing decisions?',
                a: 'Present bias is valuing immediate comfort over future gain — leading to "I\'ll start investing later." Every delayed year is compounding you never recover.',
              },
              {
                q: 'Is keeping money in a savings account truly risk-free?',
                a: 'No — it is free of market risk but exposed to inflation risk. At 0.05% with 2.5% inflation, you lose 2.45% of purchasing power every year.',
              },
              {
                q: 'What have broad market investments historically returned per year?',
                a: 'The S&P 500 has historically averaged ~10% p.a. and the Singapore STI ~7–8% p.a. — both significantly outpacing long-term inflation.',
              },
            ],
          },
          // ── LESSON 7-2 ──────────────────────────────
          {
            id: '7-2',
            title: 'Risk & Return',
            icon: '⚖️',
            topic: 'Risk return tradeoff investing',
            duration: '6 min',
            fincoins: 55,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'tradeoff',
                title: 'The Risk-Return Tradeoff',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'The Risk-Return Tradeoff',
                  },
                  {
                    type: 'text',
                    text: 'Every investment involves a tradeoff between risk and return. This is not a flaw in the system — it is the system. Understanding this tradeoff, rather than trying to avoid risk entirely, is what separates informed investors from fearful ones. The goal is not zero risk — it is the right amount of risk for your situation.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Risk-Return Tradeoff',
                    definition: 'The principle that higher potential returns always come with higher risk of loss. No legitimate investment offers high returns with zero risk — the two are inseparable in functioning markets.',
                  },
                  {
                    type: 'callout',
                    variant: 'warning',
                    text: 'If someone offers you a high-return, zero-risk investment — that is the definition of a scam. In legitimate financial markets, risk and return are always proportional. Promises of guaranteed high returns are the oldest financial fraud in existence.',
                  },
                  {
                    type: 'subheading',
                    text: 'The Risk-Return Spectrum',
                  },
                  {
                    type: 'table',
                    headers: ['Instrument', 'Typical Return', 'Risk Level', 'Best For'],
                    rows: [
                      ['Cash / Savings', '0.05–4% p.a.', '🟢 Very Low', 'Emergency fund, short-term goals'],
                      ['SSBs / T-Bills', '2.5–4% p.a.', '🟢 Very Low', 'Lump sums, capital protection'],
                      ['Bonds / Bond ETFs', '3–5% p.a.', '🟡 Low-Medium', 'Stability, portfolio cushion'],
                      ['Diversified Equity ETFs', '7–10% p.a. (historical)', '🟠 Medium-High', 'Long-term wealth building'],
                      ['Individual Stocks', 'Variable, -100% to +∞', '🔴 High', 'Experienced investors only'],
                      ['Crypto / Speculative', 'Highly variable', '🔴 Very High', 'Speculation, not investing'],
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'The S&P 500 has historically returned ~10% p.a. over the long run — but with individual years ranging from -38% (2008) to +32% (2013). Higher average returns come with higher short-term volatility. That volatility is the price of admission for long-term gains.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Historical average returns for STI, S&P 500, and bonds',
                    prompt: 'historical average annual returns Singapore STI S&P 500 index global bonds comparison long term investing',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '7-2-s1-tinder',
                    fincoins: 10,
                    title: 'Risk & Return — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'A guaranteed high-return, zero-risk investment is a sign of a legitimate financial opportunity.',
                        isTrue: false,
                        explanation: 'In legitimate markets, risk and return are always proportional. Any promise of high returns with zero risk is a defining characteristic of financial fraud — the oldest scam in existence.',
                      },
                      {
                        text: 'Inflation risk means your investment could lose purchasing power even if its nominal value increases.',
                        isTrue: true,
                        explanation: 'If your investment returns 2% but inflation is 3%, you\'ve gained in dollar terms but lost in purchasing power. Inflation risk is the hidden cost of being too conservative.',
                      },
                      {
                        text: 'Concentration risk can be almost entirely eliminated by investing in a broad market ETF.',
                        isTrue: true,
                        explanation: 'A broad market ETF spreads exposure across hundreds or thousands of companies — no single company\'s failure can significantly damage your portfolio.',
                      },
                      {
                        text: 'Selling your portfolio during a market downturn is the safest way to protect your money.',
                        isTrue: false,
                        explanation: 'Selling during a downturn locks in losses permanently. Markets have historically always recovered — staying invested is almost always the correct decision for long-term investors.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'types',
                title: 'Types of Investment Risk',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Types of Investment Risk',
                  },
                  {
                    type: 'text',
                    text: 'Risk is not one thing — it has different flavours that affect your portfolio in different ways. Understanding each type tells you how to manage it, not just fear it.',
                  },
                  {
                    type: 'topiccards',
                    cards: [
                      {
                        icon: '📊',
                        label: 'Market Risk',
                        description: 'The risk that the whole market falls',
                        color: '#DC2626',
                        details: [
                          'Market risk affects all investments simultaneously — it cannot be eliminated through stock-picking',
                          'Even strong companies lose value during broad market downturns',
                          'Example: during the 2020 COVID crash, the S&P 500 fell ~34% in weeks regardless of individual company quality',
                        ],
                        example: 'How to manage it: stay invested for the long term. Market downturns are temporary — historically, markets have always recovered and gone on to new highs.',
                      },
                      {
                        icon: '💸',
                        label: 'Inflation Risk',
                        description: 'The risk that returns don\'t beat inflation',
                        color: '#F59E0B',
                        details: [
                          'Inflation risk is the primary risk of being too conservative — keeping everything in cash or low-yield savings',
                          'You can grow your balance in dollar terms while losing real purchasing power',
                          'Example: a 2% fixed deposit with 3% inflation produces a -1% real return',
                        ],
                        example: 'How to manage it: ensure your overall portfolio earns a real return above inflation — which typically requires some exposure to equities.',
                      },
                      {
                        icon: '🔒',
                        label: 'Liquidity Risk',
                        description: 'The risk of not being able to exit when needed',
                        color: '#4F46E5',
                        details: [
                          'Highly liquid assets (stocks, ETFs) can be sold instantly at market price',
                          'Illiquid assets (property, private equity) may take months or years to exit',
                          'Example: a student who invested their emergency fund in property cannot access those funds in a medical emergency',
                        ],
                        example: 'How to manage it: keep your emergency fund in liquid instruments (HYSA, SSB) and only lock up money you genuinely won\'t need.',
                      },
                      {
                        icon: '🎯',
                        label: 'Concentration Risk',
                        description: 'The risk of being overexposed to one asset',
                        color: '#059669',
                        details: [
                          'Concentration risk is the most common and most avoidable risk for beginner investors',
                          'A large position in a single company, sector, or geography means one bad outcome devastates your whole portfolio',
                          'Example: putting all savings into a single company\'s stock — if that company fails, you lose everything',
                        ],
                        example: 'How to manage it: diversify across asset classes, sectors, and geographies. A broad ETF eliminates concentration risk almost entirely.',
                      },
                    ],
                  },
                  {
                    type: 'subheading',
                    text: 'How Each Risk Applies to You',
                  },
                  {
                    type: 'flipcards',
                    variant: 'neutral',
                    title: 'Risk type → what it means for a student investor:',
                    cards: [
                      {
                        frontLabel: '📊 Market Risk',
                        backLabel: '🎓 For students',
                        front: 'Broad market falls affect all investments — even good ones.',
                        back: 'Your biggest defence against market risk is time horizon. A student investing for 20+ years can ride out any correction — short-term drops are noise on a long-term chart.',
                        tag: 'Time horizon is your shield',
                      },
                      {
                        frontLabel: '💸 Inflation Risk',
                        backLabel: '🎓 For students',
                        front: 'Returns below inflation mean losing purchasing power even as your balance grows.',
                        back: 'Students with money sitting in 0.05% accounts are already experiencing inflation risk. Optimised HYSAs and SSBs are the first line of defence — equities for the long term.',
                        tag: 'Already affecting your savings today',
                      },
                      {
                        frontLabel: '🔒 Liquidity Risk',
                        backLabel: '🎓 For students',
                        front: 'Illiquid investments can\'t be accessed in an emergency without a penalty or loss.',
                        back: 'Never invest your emergency fund — it must stay liquid. Only invest money with a horizon of 3+ years that you\'re genuinely certain you won\'t need.',
                        tag: 'Emergency fund = always liquid',
                      },
                      {
                        frontLabel: '🎯 Concentration Risk',
                        backLabel: '🎓 For students',
                        front: 'One bad bet on a single stock can wipe out years of savings.',
                        back: 'Beginner investors are most vulnerable here. A broad index ETF (e.g. Nikko STI ETF or a global index fund) instantly eliminates concentration risk across hundreds of companies.',
                        tag: 'One ETF solves this entirely',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Recent examples of each risk type playing out in Singapore markets',
                    prompt: 'recent examples market risk inflation risk liquidity risk concentration risk Singapore investors 2024 2025',
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'tolerance',
                title: 'Your Risk Tolerance',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'Your Risk Tolerance',
                  },
                  {
                    type: 'text',
                    text: 'Your risk tolerance is how much volatility and potential loss you can handle — both financially and emotionally — without making panic decisions. It depends on your time horizon, income stability, and personality. Knowing your risk tolerance before you invest prevents the most expensive mistake in investing: selling at the bottom.',
                  },
                  {
                    type: 'subheading',
                    text: 'Three Factors That Shape Your Risk Tolerance',
                  },
                  {
                    type: 'table',
                    headers: ['Factor', 'Lower Risk Tolerance', 'Higher Risk Tolerance'],
                    rows: [
                      ['Time horizon', 'Need money within 1–3 years', 'Don\'t need money for 10+ years'],
                      ['Income stability', 'Irregular / part-time income', 'Stable full-time salary'],
                      ['Emergency fund', 'Not fully funded', '3–6 months fully funded'],
                      ['Emotional resilience', 'Panic during -15% drops', 'Hold comfortably through -30%'],
                      ['Financial dependents', 'Supporting family members', 'Supporting yourself only'],
                    ],
                    firstColAccent: true,
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: Most robo-advisors (Syfe, StashAway, Endowus) include a risk tolerance questionnaire when you sign up — they use your answers to build a portfolio automatically matched to your profile. This is one of the most practical ways to invest at the right risk level without needing to know the details yourself.',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '7-2-s3-scenarios',
                    fincoins: 10,
                    title: 'What portfolio fits your risk tolerance?',
                    scenarios: [
                      {
                        icon: '🛡️',
                        situation: 'You\'re a final-year student with $5,000 saved. You\'re graduating in 8 months and will need this money for relocation and initial work expenses. You cannot afford to lose any of it.',
                        options: [
                          {
                            text: 'Invest the full $5,000 in an S&P 500 ETF for growth.',
                            biasLabel: 'Wrong time horizon',
                            biasExplanation: 'An 8-month horizon is far too short for equity investing. Markets can fall 20–30% in months — you could need this money right at the bottom of a correction.',
                            isIdeal: false,
                          },
                          {
                            text: 'Place the full $5,000 in a 6-month T-bill or fixed deposit.',
                            biasLabel: 'Right tool for this goal ✓',
                            biasExplanation: 'Short-term, capital-critical money belongs in capital-protected instruments. A T-bill or FD guarantees your principal with a competitive return — perfectly matched to your 8-month horizon.',
                            isIdeal: true,
                          },
                          {
                            text: 'Split $2,500 into an ETF and $2,500 into an FD for balance.',
                            biasLabel: 'Still too much risk',
                            biasExplanation: 'If you genuinely need this money in 8 months, any equity exposure is inappropriate. The equity half could drop 30% right when you need it — a split feels balanced but the risk is real.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '📈',
                        situation: 'You\'ve just started full-time work, earning $3,500/month. You have a fully funded emergency fund and $500/month to invest. You won\'t need this money for at least 10 years.',
                        options: [
                          {
                            text: 'Invest the $500/month entirely in Singapore Savings Bonds.',
                            biasLabel: 'Too conservative for 10 years',
                            biasExplanation: 'SSBs are excellent for capital protection but are not designed for long-term wealth building. At 3% p.a. with 2.5% inflation, you\'re barely growing your real wealth over a 10-year horizon.',
                            isIdeal: false,
                          },
                          {
                            text: 'Invest in a diversified ETF portfolio — e.g. 80% global equities, 20% bonds.',
                            biasLabel: 'Well-matched to your profile ✓',
                            biasExplanation: 'A 10-year horizon with stable income and a funded emergency fund is textbook equity-friendly. An 80/20 portfolio captures most equity upside while bonds cushion short-term volatility.',
                            isIdeal: true,
                          },
                          {
                            text: 'Put everything in a single high-growth tech stock for maximum return.',
                            biasLabel: 'Concentration risk',
                            biasExplanation: 'Single-stock investing introduces enormous concentration risk — one bad earnings call or sector downturn could wipe out years of gains. Diversification captures market growth without this exposure.',
                            isIdeal: false,
                          },
                        ],
                      },
                      {
                        icon: '😰',
                        situation: 'You started investing 6 months ago. Markets have dropped 15% and your $10,000 portfolio is now worth $8,500. You\'re considering selling everything to stop further losses.',
                        options: [
                          {
                            text: 'Sell everything and move to cash — you can reinvest when markets recover.',
                            biasLabel: 'Classic loss aversion trap',
                            biasExplanation: 'Selling at -15% locks in your loss permanently. Waiting to "reinvest when markets recover" means you miss the recovery entirely — the best market days often follow the worst.',
                            isIdeal: false,
                          },
                          {
                            text: 'Hold your position — a 15% drawdown is normal and temporary for a long-term investor.',
                            biasLabel: 'Correct response ✓',
                            biasExplanation: 'Market corrections of 10–20% happen regularly and historically always recover. Staying invested is the single most important decision a long-term investor makes during downturns.',
                            isIdeal: true,
                          },
                          {
                            text: 'Buy more while prices are lower — dollar-cost average into the dip.',
                            biasLabel: 'Also a strong move',
                            biasExplanation: 'If you have spare capital and a long horizon, buying during corrections is historically one of the best moves you can make. Both holding and buying more are correct — selling is the only wrong answer.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 How do I assess my risk tolerance and choose the right investment portfolio in Singapore?',
                    prompt: 'how to assess risk tolerance Singapore investor profile portfolio allocation robo-advisor 2025',
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Risk & Return',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on the risk-return tradeoff, the four types of investment risk, and how to match risk tolerance to your situation.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — key concepts in investment risk and return?',
                    prompt: 'investment risk return tradeoff types of risk market inflation liquidity concentration Singapore summary 2025',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '7-2-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Risk & Return',
                    questions: [
                      {
                        concept: 'Risk-return tradeoff',
                        question: 'A friend shows you an investment platform promising 18% annual returns with "guaranteed capital protection." What is the most accurate assessment?',
                        options: [
                          'It sounds promising — 18% is high but not impossible if it\'s a well-managed fund',
                          'It\'s likely a scam — in legitimate markets, guaranteed high returns with zero risk do not exist',
                          'It could be legitimate if the platform is MAS-regulated',
                          'It\'s safe as long as you only invest a small amount to test it first',
                        ],
                        correctIndex: 1,
                        explanation: 'Guaranteed high returns with capital protection is the defining characteristic of financial fraud. In legitimate markets, risk and return are always proportional — no MAS-regulated platform can promise both simultaneously. This is the oldest financial scam in existence.',
                      },
                      {
                        concept: 'Types of risk',
                        question: 'A student keeps their entire $20,000 savings in a fixed deposit earning 2% p.a. Singapore\'s inflation rate is 3%. Which risk are they most exposed to?',
                        options: [
                          'Market risk — fixed deposits fluctuate with market conditions',
                          'Concentration risk — all their money is in one instrument',
                          'Inflation risk — their real return is -1% p.a., so purchasing power is shrinking despite earning interest',
                          'Liquidity risk — fixed deposits cannot be accessed before maturity',
                        ],
                        correctIndex: 2,
                        explanation: 'With a 2% return against 3% inflation, the student\'s real return is -1% p.a. — their purchasing power is shrinking even as their balance grows. This is inflation risk: the hidden cost of being too conservative. While liquidity risk is also present, inflation risk is the primary ongoing concern.',
                      },
                      {
                        concept: 'Risk tolerance matching',
                        question: 'A student has a 15-year investment horizon, a fully funded emergency fund, and stable income. They are deciding between 100% SSBs vs an 80% equity / 20% bond ETF portfolio. Which is more appropriate and why?',
                        options: [
                          '100% SSBs — capital protection is always the priority regardless of time horizon',
                          '80/20 equity-bond portfolio — a 15-year horizon with stable income and emergency fund coverage makes equity exposure appropriate and necessary for real wealth growth',
                          '100% SSBs for the first 5 years, then switch to equities — a staged approach is always best',
                          '80/20 equity-bond portfolio only if the student has investment experience — beginners should stick to SSBs',
                        ],
                        correctIndex: 1,
                        explanation: 'With a 15-year horizon, stable income, and a funded emergency fund, the student has all three preconditions for equity-appropriate investing. SSBs at 3% barely beat inflation — over 15 years, an 80/20 equity-bond portfolio historically generates significantly more real wealth. Capital protection is for short horizons; long horizons can absorb volatility.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'What is the risk-return tradeoff?',
                a: 'Higher potential returns always come with higher risk. No legitimate investment offers high returns with zero risk — in functioning markets, the two are inseparable.',
              },
              {
                q: 'What is concentration risk and how do you avoid it?',
                a: 'The risk of being overexposed to a single asset, sector, or geography. Avoided by diversifying across multiple assets — a broad ETF eliminates it almost entirely.',
              },
              {
                q: 'What is liquidity risk?',
                a: 'The risk of not being able to sell an investment quickly without a significant loss in value. Managed by keeping emergency funds in liquid instruments and only locking up money you won\'t need.',
              },
              {
                q: 'Why is selling during a market downturn almost always the wrong decision?',
                a: 'Selling locks in losses permanently. Historically, markets always recover — and the best recovery days often follow the worst drawdown days, which you miss if you\'ve sold.',
              },
              {
                q: 'What is inflation risk and who is most exposed to it?',
                a: 'The risk that your returns fail to keep pace with inflation, eroding purchasing power. Most exposed: investors who keep everything in cash or low-yield savings accounts.',
              },
            ],
          },      
          // ── LESSON 7-3 ──────────────────────────────
          {
            id: '7-3',
            title: 'Diversification',
            icon: '🎨',
            topic: 'Diversification portfolio investing strategy',
            duration: '5 min',
            fincoins: 55,
            sections: [

              // ─── SECTION 1 ───────────────────────────
              {
                key: 'what',
                title: 'What is Diversification?',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'What is Diversification?',
                  },
                  {
                    type: 'text',
                    text: 'Diversification is often called the only free lunch in investing — and for good reason. By spreading your investments across different assets, sectors, and geographies, you reduce risk without necessarily reducing your expected return. It is the single most powerful tool available to ordinary investors, and it costs nothing to implement.',
                  },
                  {
                    type: 'keyterm',
                    term: 'Diversification',
                    definition: 'Spreading investments across different assets, sectors, and geographies so that a loss in one position does not devastate your entire portfolio. When one asset falls, others may hold steady or rise — smoothing out overall returns.',
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: 'A portfolio of 1 stock is entirely at the mercy of that single company. A portfolio of 500 stocks — like an S&P 500 ETF — has smoothed out individual company risk almost entirely. One company failing has a 0.2% impact instead of a 100% one.',
                  },
                  {
                    type: 'timeline',
                    title: 'Three layers of diversification:',
                    nodes: [
                      {
                        icon: '🏛️',
                        label: 'Asset Class',
                        sublabel: 'Stocks, bonds, cash',
                        color: '#4F46E5',
                        examples: ['Stocks: high return, high volatility', 'Bonds: lower return, lower volatility', 'Cash: stable, inflation risk'],
                        details: [
                          'Different asset classes behave differently under the same market conditions — when stocks fall, bonds often hold steady or rise.',
                          'A mix of stocks and bonds smooths out portfolio volatility without proportionally reducing long-term returns.',
                          'The classic 60/40 portfolio (60% stocks, 40% bonds) has historically delivered strong risk-adjusted returns for decades.',
                        ],
                        tip: 'Your stock/bond split should reflect your time horizon — longer horizon means more stocks. A 25-year-old with a 30-year horizon can hold mostly equities; someone near retirement should hold more bonds.',
                      },
                      {
                        icon: '🌍',
                        label: 'Geography',
                        sublabel: 'Singapore, US, global',
                        color: '#0891B2',
                        examples: ['Singapore STI: local exposure', 'S&P 500: US exposure', 'Global ETF: 50+ countries'],
                        details: [
                          'Concentrating all investments in Singapore means your portfolio rises and falls with the Singapore economy alone.',
                          'Geographic diversification spreads risk across multiple economies — when Singapore underperforms, the US or emerging markets may offset it.',
                          'A global ETF provides exposure to 50+ countries in a single instrument — the simplest form of geographic diversification.',
                        ],
                        tip: 'Home bias — the tendency to overinvest in your own country — is one of the most common portfolio mistakes. Singapore is 0.3% of global market cap; a globally diversified portfolio reflects the actual world economy.',
                      },
                      {
                        icon: '🧰',
                        label: 'Instrument',
                        sublabel: 'ETFs, unit trusts, individual stocks',
                        color: '#059669',
                        examples: ['ETF: low cost, instant diversification', 'Unit trust: managed, higher fees', 'Individual stocks: high risk, high effort'],
                        details: [
                          'The instrument you use determines how efficiently you diversify — an ETF gives you hundreds of holdings in one trade.',
                          'Individual stocks require significant research and capital to diversify effectively — owning 5 stocks is not diversification.',
                          'For most retail investors, a combination of low-cost ETFs is the most efficient path to broad diversification.',
                        ],
                        tip: 'For Singapore investors, a simple two-ETF portfolio — a global equity ETF and a Singapore bond ETF — provides broad diversification at minimal cost and complexity.',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Popular ETFs available to Singapore retail investors and their expense ratios',
                    prompt: 'popular ETFs available Singapore retail investors 2025 expense ratios IWDA STI ETF Syfe StashAway comparison',
                  },
                  {
                    type: 'tindertruefalse',
                    exerciseId: '7-3-s1-tinder',
                    fincoins: 10,
                    title: 'Diversification — True or False?',
                    instruction: 'Swipe right for True · Swipe left for False',
                    statements: [
                      {
                        text: 'Diversification eliminates all investment risk — a diversified portfolio cannot lose money.',
                        isTrue: false,
                        explanation: 'Diversification reduces concentration and specific risk — but market risk remains. During broad market downturns, even well-diversified portfolios fall. Diversification smooths volatility; it doesn\'t eliminate loss.',
                      },
                      {
                        text: 'A global equity ETF can provide exposure to companies in 50 or more countries in a single purchase.',
                        isTrue: true,
                        explanation: 'Global ETFs like IWDA track thousands of companies across developed markets worldwide — one purchase delivers broad geographic and sector diversification instantly.',
                      },
                      {
                        text: 'Home bias — overinvesting in your own country — is a common portfolio mistake for Singapore investors.',
                        isTrue: true,
                        explanation: 'Singapore represents approximately 0.3% of global market capitalisation. A portfolio heavily concentrated in Singapore stocks is dramatically underexposed to the other 99.7% of global economic activity.',
                      },
                      {
                        text: 'Owning five individual stocks from the same country and sector counts as a well-diversified portfolio.',
                        isTrue: false,
                        explanation: 'Five stocks in the same country and sector represents significant geographic and sector concentration — not diversification. True diversification spreads across asset classes, sectors, and geographies.',
                      },
                    ],
                  },
                ],
              },

              // ─── SECTION 2 ───────────────────────────
              {
                key: 'how',
                title: 'How to Diversify',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'How to Diversify',
                  },
                  {
                    type: 'text',
                    text: 'Knowing that diversification matters is one thing — knowing how to apply it practically is another. Most beginner investors either under-diversify (too concentrated) or accidentally over-diversify (owning many highly correlated assets they think are different). Here\'s how to do it right.',
                  },
                  {
                    type: 'subheading',
                    text: 'Diversified or Concentrated?',
                  },
                  {
                    type: 'scenarios',
                    exerciseId: '7-3-s2-scenarios',
                    fincoins: 10,
                    title: 'Diversified or Concentrated?',
                    scenarios: [
                      {
                        icon: '💻',
                        situation: 'You have put all your savings into one tech company\'s shares because you believe strongly in the product.',
                        options: [
                          {
                            text: '✅ Diversified — strong conviction in one company is enough.',
                            biasLabel: 'Incorrect',
                            biasExplanation: 'One company, one sector. If it underperforms or fails, your entire portfolio suffers. Strong conviction doesn\'t protect you from company-specific risks like management failures, regulatory changes, or sector downturns.',
                            isIdeal: false,
                          },
                          {
                            text: '⚠️ Concentrated — single-stock portfolios carry maximum company-specific risk.',
                            biasLabel: 'Correct ✓',
                            biasExplanation: 'Single-stock portfolios live and die by one company\'s performance — no diversification benefit at all. Even the best companies can collapse. Enron, Lehman Brothers, and Nokia were all considered unbeatable before they failed.',
                            isIdeal: true,
                          },
                        ],
                      },
                      {
                        icon: '🏦',
                        situation: 'You own shares in DBS, OCBC, and UOB — Singapore\'s three major banks.',
                        options: [
                          {
                            text: '✅ Diversified — three different companies across the same sector.',
                            biasLabel: 'Incorrect',
                            biasExplanation: 'Three stocks in the same country and same sector are highly correlated — they tend to fall together when Singapore\'s banking sector faces headwinds. More companies does not mean more diversification if they move in lockstep.',
                            isIdeal: false,
                          },
                          {
                            text: '⚠️ Concentrated — same country, same sector means high correlation.',
                            biasLabel: 'Correct ✓',
                            biasExplanation: 'Geographic and sector concentration persists even with multiple stocks. During the 2020 COVID crash, all three Singapore bank stocks fell simultaneously. True diversification requires spreading across different sectors, asset classes, and geographies.',
                            isIdeal: true,
                          },
                        ],
                      },
                      {
                        icon: '🌍',
                        situation: 'You invest in a global equity ETF covering 50+ countries and a Singapore bond ETF.',
                        options: [
                          {
                            text: '✅ Diversified — two instruments covering multiple asset classes and geographies.',
                            biasLabel: 'Correct ✓',
                            biasExplanation: 'A global equity ETF plus a local bond ETF achieves asset class diversification (equities vs bonds) and geographic diversification (global exposure) in just two purchases. This is a textbook low-cost diversified portfolio.',
                            isIdeal: true,
                          },
                          {
                            text: '⚠️ Concentrated — only two instruments is not enough.',
                            biasLabel: 'Incorrect',
                            biasExplanation: 'The number of instruments matters less than what they hold. Two ETFs covering thousands of companies across 50+ countries and multiple asset classes is more diversified than 20 individual stocks in one sector.',
                            isIdeal: false,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'subheading',
                    text: 'Common Diversification Mistakes',
                  },
                  {
                    type: 'flipcards',
                    variant: 'reframe',
                    title: 'Mistakes investors make when diversifying:',
                    cards: [
                      {
                        frontLabel: '❌ The Mistake',
                        backLabel: '✅ The Fix',
                        front: 'Owning 10 tech ETFs and thinking you\'re diversified — they all hold the same top 20 companies.',
                        back: 'Check what your ETFs actually hold. Overlapping ETFs in the same sector or index provide no additional diversification. A single global ETF often beats five sector ETFs in terms of real spread.',
                        tag: 'Overlap ≠ diversification',
                      },
                      {
                        frontLabel: '❌ The Mistake',
                        backLabel: '✅ The Fix',
                        front: 'Keeping all investments in Singapore because it\'s familiar and "safer."',
                        back: 'Singapore is ~0.3% of global market cap. Home bias means your portfolio misses 99.7% of global economic activity. A global ETF corrects this in one purchase with no additional complexity.',
                        tag: 'Home bias costs real returns',
                      },
                      {
                        frontLabel: '❌ The Mistake',
                        backLabel: '✅ The Fix',
                        front: 'Thinking diversification means owning many different individual stocks.',
                        back: 'Twenty individual stocks is still underdiversified — and requires significant research to manage. One broad ETF holding 500–3,000 companies achieves far better diversification at a fraction of the effort and cost.',
                        tag: 'ETFs beat stock-picking for diversification',
                      },
                    ],
                  },
                  {
                    type: 'bot',
                    label: '💬 Latest performance comparison — STI ETF, S&P 500 ETF, and balanced portfolio for Singapore investors',
                    prompt: 'STI ETF vs S&P 500 ETF vs balanced portfolio performance comparison Singapore investors 2024 2025 returns',
                  },
                ],
              },

              // ─── SECTION 3 ───────────────────────────
              {
                key: 'etf',
                title: 'ETFs as Instant Diversification',
                fincoins: 10,
                content: [
                  {
                    type: 'heading',
                    text: 'ETFs as Instant Diversification',
                  },
                  {
                    type: 'text',
                    text: 'An Exchange-Traded Fund (ETF) is a single instrument that holds a basket of assets — stocks, bonds, or both — tracking an index. For retail investors, ETFs are the most efficient path to diversification: one purchase, hundreds or thousands of holdings, and minimal cost.',
                  },
                  {
                    type: 'keyterm',
                    term: 'ETF (Exchange-Traded Fund)',
                    definition: 'A fund traded on a stock exchange that holds a collection of assets tracking an index. Buying one ETF unit gives you proportional ownership in all of its holdings — instant diversification at the cost of a single trade.',
                  },
                  {
                    type: 'subheading',
                    text: 'ETFs Available to Singapore Retail Investors',
                  },
                  {
                    type: 'table',
                    headers: ['ETF', 'What It Holds', 'Geographic Exposure', 'Expense Ratio'],
                    rows: [
                      ['Nikko AM STI ETF', '30 largest Singapore companies', '🇸🇬 Singapore only', '~0.30% p.a.'],
                      ['SPDR S&P 500 ETF (SPY)', '500 largest US companies', '🇺🇸 US only', '~0.09% p.a.'],
                      ['iShares MSCI World (IWDA)', '~1,500 companies, 23 developed markets', '🌍 Global (developed)', '~0.20% p.a.'],
                      ['Vanguard Total World (VT)', '~9,500 companies, 50+ countries', '🌍 Global (all)', '~0.07% p.a.'],
                      ['ABF Singapore Bond ETF', 'Singapore government & agency bonds', '🇸🇬 Singapore bonds', '~0.24% p.a.'],
                    ],
                    firstColAccent: true,
                  },
                  {
                    type: 'callout',
                    variant: 'tip',
                    text: 'Singapore Tip: For most students, a simple two-ETF portfolio — IWDA (global equities) + ABF Singapore Bond ETF (local bonds) — achieves broad geographic and asset class diversification at under 0.25% p.a. in total fees. That\'s cheaper than almost every unit trust or robo-advisor available.',
                  },
                  {
                    type: 'slider',
                    icon: '💸',
                    title: 'The Cost of Fees Over Time',
                    description: 'Drag to your investment amount to see how expense ratios erode returns over 20 years — ETF fees vs typical unit trust fees at the same illustrative 7% gross return.',
                    min: 1000,
                    max: 50000,
                    step: 1000,
                    initialValue: 10000,
                    prefix: '$',
                    calculateResult: (amount) => [
                      { label: '📊 ETF (0.20% p.a.) after 20 years', value: `$${Math.round(amount * Math.pow(1.068, 20)).toLocaleString()}`, color: '#059669' },
                      { label: '🏦 Robo-advisor (0.65% p.a.) after 20 years', value: `$${Math.round(amount * Math.pow(1.0635, 20)).toLocaleString()}`, color: '#0891B2' },
                      { label: '📋 Unit trust (1.50% p.a.) after 20 years', value: `$${Math.round(amount * Math.pow(1.055, 20)).toLocaleString()}`, color: '#F59E0B' },
                      { label: '💼 Active fund (2.50% p.a.) after 20 years', value: `$${Math.round(amount * Math.pow(1.045, 20)).toLocaleString()}`, color: '#DC2626' },
                    ],
                  },
                  {
                    type: 'callout',
                    variant: 'fact',
                    text: '$10,000 invested at 7% gross return over 20 years: ETF at 0.20% → ~$37,300. Active fund at 2.50% → ~$24,100. The fee difference alone costs you over $13,000 — without adding a single dollar more.',
                  },
                  {
                    type: 'bot',
                    label: '💬 How to buy ETFs in Singapore — brokerage accounts and RSS plans',
                    prompt: 'how to buy ETFs Singapore brokerage account regular shares savings plan IBKR FSMOne OCBC DBS 2025',
                  },
                ],
              },

              // ─── SECTION 4 ───────────────────────────
              {
                key: 'challenge',
                title: 'Challenge',
                fincoins: 25,
                content: [
                  {
                    type: 'heading',
                    text: 'Challenge: Diversification',
                  },
                  {
                    type: 'text',
                    text: 'Three questions on what diversification actually means, how to spot false diversification, and why ETFs beat individual stocks for most investors.',
                  },
                  {
                    type: 'bot',
                    label: '💬 Quick recap — what makes a portfolio truly diversified?',
                    prompt: 'what makes a portfolio truly diversified asset class geographic sector ETF Singapore investing 2025',
                  },
                  {
                    type: 'multistepmcq',
                    exerciseId: '7-3-s4-mcq',
                    fincoins: 25,
                    icon: '🎯',
                    title: 'Diversification',
                    questions: [
                      {
                        concept: 'What diversification actually does',
                        question: 'A student says "diversification means I can\'t lose money." Which statement most accurately corrects this?',
                        options: [
                          'Correct — a diversified portfolio across 500 stocks cannot fall in value',
                          'Diversification eliminates concentration risk and specific risk, but market risk remains — a diversified portfolio still falls during broad downturns',
                          'Diversification only helps if you hold at least 3 different asset classes simultaneously',
                          'Diversification eliminates all risk as long as you include both stocks and bonds',
                        ],
                        correctIndex: 1,
                        explanation: 'Diversification is a tool for reducing concentration risk — the risk that one bad position devastates your whole portfolio. It cannot eliminate market risk — the risk that all assets fall simultaneously during a broad economic shock. A diversified portfolio still fell ~34% in the 2020 COVID crash before recovering.',
                      },
                      {
                        concept: 'Spotting false diversification',
                        question: 'A student owns shares in DBS, OCBC, UOB, CapitaLand, and Singtel — five different Singapore companies across banking, property, and telecoms. Is this well-diversified?',
                        options: [
                          'Yes — five companies across three sectors is strong diversification',
                          'Partially — sector diversification exists within Singapore, but geographic concentration means the portfolio rises and falls with the Singapore economy alone',
                          'Yes — owning five stocks is the definition of a diversified portfolio',
                          'No — you need at least 20 individual stocks to achieve any meaningful diversification',
                        ],
                        correctIndex: 1,
                        explanation: 'Three sectors within one country is better than one sector — but geographic concentration remains. Singapore is ~0.3% of global market cap. If Singapore\'s economy underperforms, all five stocks are likely to suffer simultaneously regardless of sector differences. A global ETF would address this gap in a single purchase.',
                      },
                      {
                        concept: 'ETFs vs individual stocks',
                        question: 'A student has $5,000 to invest and is deciding between buying 5 individual Singapore stocks or one global ETF. Which approach provides better diversification and why?',
                        options: [
                          'Five individual stocks — more active management means more control over diversification',
                          'One global ETF — it holds thousands of companies across 50+ countries, providing far broader diversification than 5 individual stocks at a fraction of the research effort',
                          'Five individual stocks — a hands-on approach always outperforms passive ETFs over the long run',
                          'They are equivalent — 5 stocks and one ETF provide the same level of diversification',
                        ],
                        correctIndex: 1,
                        explanation: 'A global ETF like IWDA holds ~1,500 companies across 23 developed markets. Five individual Singapore stocks hold 5 companies in one country. The ETF achieves broader asset, geographic, and sector diversification in a single trade — while research consistently shows that most active stock-pickers underperform broad index ETFs over the long term.',
                      },
                    ],
                  },
                ],
              },
            ],

            flashcards: [
              {
                q: 'Why is diversification called the only free lunch in investing?',
                a: 'It reduces risk without necessarily reducing expected return — spreading across assets smooths volatility at no additional cost.',
              },
              {
                q: 'What is home bias and why is it a problem for Singapore investors?',
                a: 'Home bias is overinvesting in your own country. Singapore is ~0.3% of global market cap — a Singapore-heavy portfolio misses 99.7% of global economic growth.',
              },
              {
                q: 'Does diversification eliminate all investment risk?',
                a: 'No — it eliminates concentration and specific risk, but market risk remains. A diversified portfolio still falls during broad market downturns.',
              },
              {
                q: 'Why does owning five stocks in the same sector not count as diversification?',
                a: 'Same-sector stocks are highly correlated — they tend to fall together. True diversification requires spreading across different sectors, asset classes, and geographies.',
              },
              {
                q: 'What is the simplest way for a Singapore retail investor to achieve broad diversification?',
                a: 'Buy a low-cost global equity ETF — one purchase provides exposure to thousands of companies across 50+ countries at minimal cost.',
              },
            ],
          },
        ],
      },
      {
        id: 'chapter-8',
        title: 'Investing in Singapore',
        icon: '🇸🇬',
        description: 'Practical investing options available to you right now',
        lessons: [
          { id: '8-1', title: 'Opening a CDP & Brokerage Account', icon: '🏦', topic: 'CDP account brokerage Singapore how to open invest', duration: '7 min', fincoins: 90, sections: [{ key: 'cdp', heading: 'What is a CDP Account?' }, { key: 'brokers', heading: 'Singapore Brokerages Compared' }, { key: 'open', heading: 'Opening Your Account' }],
          content: [
            // ─── Section 1: What is a CDP Account? ───────────────
            { type: 'heading', text: 'What is a CDP Account?' },
            {
              type: 'text',
              text: 'Investing in Singapore-listed shares requires two separate accounts to be in place before a single trade can be executed. The first is a Central Depository (CDP) account — a free account issued by SGX that holds shares in the investor\'s name. The second is a brokerage account — the trading platform used to place buy and sell orders. These two accounts serve completely different purposes, and understanding how they interact is the foundation of investing in Singapore.',
            },
            {
              type: 'keyterm',
              term: 'CDP Account (Central Depository)',
              definition: 'A free account issued by SGX that holds Singapore-listed securities in your name. Think of it as your personal share safe — it stores your shares independently of any brokerage. Even if your broker shuts down, your shares in CDP remain legally yours.',
            },
            {
              type: 'bot',
              label: '💬 How to open a CDP account in Singapore as an international student',
              prompt: 'How to open a CDP account Singapore 2025 requirements international student student pass documents needed steps SGX',
            },
            {
              type: 'callout',
              variant: 'fact',
              text: 'Opening a CDP account is free and takes 3–5 business days via the SGX website. International students on a valid student pass are eligible — you need to be at least 18 years old and have a local Singapore bank account. You only ever need one CDP account for life — it links to all CDP-linked brokerages automatically.',
            },

            // ─── Section 2: What is a Brokerage Account? ─────────
            { type: 'heading', text: 'What is a Brokerage Account?' },
            {
              type: 'text',
              text: 'A brokerage account is the trading platform used to place buy and sell orders on the market. The brokerage executes trades on the investor\'s behalf — but depending on the type of broker, shares are stored very differently after a trade settles. There are two types of brokerage accounts available to Singapore retail investors.',
            },
            {
              type: 'keyterm',
              term: 'Brokerage Account',
              definition: 'A trading account that lets investors place buy and sell orders on the market. The brokerage executes trades — but depending on the broker type, shares are either stored in the investor\'s own CDP account or held internally by the broker under their name.',
            },
            {
              type: 'text',
              text: 'Brokerage accounts in Singapore fall into two categories — CDP-linked and custodian — which differ fundamentally in where shares are held after a trade executes.',
            },
            {
              type: 'topiccards',
              title: 'Two types of brokerage accounts:',
              cards: [
                {
                  icon: '🏛️',
                  label: 'CDP-Linked Broker',
                  description: 'Executes trades and credits shares directly to the investor\'s CDP account.',
                  color: '#4F46E5',
                  details: [
                    'Shares are held in the investor\'s own CDP account — legally theirs, ring-fenced from the broker.',
                    'If the broker goes bankrupt, shares are completely safe — they are not the broker\'s property.',
                    'Examples: POEMS (PhillipCapital), DBS Vickers, OCBC Securities, UOB Kay Hian.',
                    'Commissions are typically higher — from 0.12% per trade — reflecting the added safety.',
                    'Best for: long-term holding of individual Singapore stocks like DBS, CapitaLand, Keppel.',
                  ],
                  example: 'Buying 100 shares of DBS through POEMS credits those shares to the investor\'s CDP account within T+2 — they appear in the CDP statement, not just in the POEMS app.',
                },
                {
                  icon: '🔒',
                  label: 'Custodian Broker',
                  description: 'Holds shares internally under the broker\'s name — not in the investor\'s CDP account.',
                  color: '#0891B2',
                  details: [
                    'Shares are held in the broker\'s own custody account — the investor owns them beneficially, but they are registered under the broker\'s name.',
                    'Lower commissions — from 0.05% per trade — because the broker handles settlement internally.',
                    'If the broker faces insolvency, shares may be caught in proceedings — though most jurisdictions have investor protection schemes.',
                    'Examples: Tiger Brokers, Moomoo, Interactive Brokers, Saxo.',
                    'Best for: regular investing in ETFs, US stocks, or global markets where CDP linkage is not available.',
                  ],
                  example: 'Buying VWRA through Tiger Brokers means the shares sit in Tiger\'s custody account — visible in the Tiger app, but not present in the investor\'s CDP account.',
                },
              ],
            },
            {
              type: 'text',
              text: 'In addition to a brokerage account, every investor also needs a linked Singapore bank account. This is not a type of brokerage account — it is a separate requirement that handles the movement of cash when trades are executed.',
            },
            {
              type: 'topiccards',
              title: 'The third component:',
              cards: [
                {
                  icon: '🏦',
                  label: 'Linked Bank Account',
                  description: 'A Singapore bank account linked to the brokerage — where cash moves in and out when trades are executed.',
                  color: '#059669',
                  details: [
                    'Every brokerage account must be linked to a Singapore bank account for fund transfers.',
                    'Singapore stocks settle on a T+2 basis — cash is debited from the linked bank 2 business days after a trade executes.',
                    'Failed settlement due to insufficient funds incurs penalty fees — always ensure the account is funded before trading.',
                    'A dedicated savings account is preferable to a daily spending account to avoid accidentally spending settlement funds.',
                    'Compatible banks: DBS, OCBC, UOB — most brokerages accept all three.',
                  ],
                  example: 'Buying $1,000 of STI ETF on Monday means $1,000 is debited from the linked bank account on Wednesday (T+2). If the account has insufficient funds on Wednesday, a contra loss penalty applies.',
                },
              ],
            },

            // ─── Section 3: CDP vs Brokerage ─────────────────────
            { type: 'heading', text: 'CDP vs Brokerage — What\'s the Difference?' },
            {
              type: 'text',
              text: 'Students often use "CDP account" and "brokerage account" interchangeably — but they serve completely different purposes. One holds your shares; the other executes your trades. Here is exactly how they differ.',
            },
            {
              type: 'table',
              headers: ['', 'CDP Account', 'Brokerage Account'],
              rows: [
                ['Purpose', 'Holds your shares', 'Executes your trades'],
                ['Operated by', 'SGX (Singapore Exchange)', 'Private broker (Tiger, POEMS, etc.)'],
                ['Who holds shares', 'You — in your own name', 'Depends on broker type'],
                ['Cost to open', 'Free', 'Free (commissions per trade)'],
                ['How many needed', 'One — for life', 'One per broker you use'],
                ['If provider fails', 'Shares are safe — SGX-backed', 'Depends: CDP-linked = safe; Custodian = at risk'],
                ['Linked to', 'Your Singapore bank account', 'Your CDP account (if CDP-linked)'],
              ],
            },
            {
              type: 'tindertruefalse',
              title: 'CDP vs Brokerage — True or False?',
              instruction: 'Swipe right for True · Swipe left for False',
              statements: [
                {
                  text: 'Your brokerage account and your CDP account are the same thing.',
                  isTrue: false,
                  explanation: 'They serve completely different purposes. Your brokerage account executes trades; your CDP account holds the resulting shares. You need both to invest in SGX-listed stocks through a CDP-linked broker.',
                },
                {
                  text: 'Opening a CDP account costs money and requires a minimum deposit.',
                  isTrue: false,
                  explanation: 'CDP accounts are completely free to open and have no minimum deposit or balance requirement. You apply via the SGX website and the account is typically ready within 3–5 business days.',
                },
                {
                  text: 'If your CDP-linked broker goes bankrupt, your shares held in your CDP account are protected.',
                  isTrue: true,
                  explanation: 'Shares in your CDP account are held in your name by SGX — they are legally yours and ring-fenced from the broker. A broker bankruptcy cannot touch your CDP holdings.',
                },
                {
                  text: 'You need to open a new CDP account each time you switch to a different CDP-linked broker.',
                  isTrue: false,
                  explanation: 'You only ever need one CDP account. It is tied to your identity and automatically links to any CDP-linked brokerage you use — switching brokers does not require a new CDP account.',
                },
                {
                  text: 'With a custodian broker, your shares are registered under the broker\'s name rather than your own.',
                  isTrue: true,
                  explanation: 'Custodian brokers hold shares internally in their own name. You are the beneficial owner, but the shares are not registered in your name — which is why CDP-linked brokers offer stronger legal protection for long-term holders.',
                },
              ],
            },

            // ─── Section 4: Choosing Your Broker ─────────────────
            { type: 'heading', text: 'Choosing Your Broker' },
            {
              type: 'text',
              text: 'The next decision is which broker to open. The right answer depends on what you\'re investing in, how frequently you trade, and how much you\'re starting with. There is no single best broker — only the best broker for your situation.',
            },
            {
              type: 'bot',
              label: '💬 Best brokerage accounts for Singapore investors in 2025 — fees and promotions compared',
              prompt: 'Best brokerage accounts Singapore 2025 Tiger Brokers Moomoo POEMS DBS Vickers Interactive Brokers fees commissions new account promotions comparison',
            },
            {
              type: 'appcards',
              title: 'Singapore brokerages compared — tap to explore:',
              apps: [
                {
                  icon: '🐯',
                  name: 'Tiger Brokers',
                  color: '#F59E0B',
                  tagline: 'Low-cost custodian broker with SGX and US access',
                  cost: 'From 0.06% commission',
                  rating: 4.4,
                  keyFeature: 'One of the lowest commission rates available to Singapore retail investors. Covers SGX stocks, US stocks, ETFs, and options in a single app with no minimum deposit.',
                  bestFor: 'Beginners and regular investors who want low fees for both SGX and US markets without needing CDP linkage.',
                  singaporeTip: 'Tiger Brokers frequently runs new account promotions — free shares or commission rebates. Custodian broker: shares are held internally, not in your CDP account.',
                },
                {
                  icon: '🐄',
                  name: 'Moomoo',
                  color: '#059669',
                  tagline: 'Feature-rich custodian broker with strong US ETF access',
                  cost: 'From 0.05% commission',
                  rating: 4.3,
                  keyFeature: 'Among the lowest commissions in Singapore with advanced charting and free real-time US market data. Strong for US-listed ETFs like VWRA and VTI.',
                  bestFor: 'Cost-conscious investors who also want research tools and are primarily investing in US or global ETFs.',
                  singaporeTip: 'Moomoo offers a cash management account earning competitive interest on uninvested cash — useful while you decide where to deploy funds. Custodian broker: shares not held in CDP.',
                },
                {
                  icon: '📋',
                  name: 'POEMS (PhillipCapital)',
                  color: '#4F46E5',
                  tagline: 'CDP-linked broker with RSP plans and wide market access',
                  cost: 'From 0.08% commission',
                  rating: 4.0,
                  keyFeature: 'CDP-linked — shares go directly into your CDP account. Offers a Regular Savings Plan (RSP) from $100/month for automatic investing in STI ETFs and blue chips.',
                  bestFor: 'Investors who want CDP safety for Singapore stocks, or who want to automate monthly investing through a Regular Savings Plan.',
                  singaporeTip: 'POEMS\' RSP is one of the most popular ways for Singapore retail investors to dollar-cost average into the STI ETF monthly with minimal effort and low minimum amounts.',
                },
                {
                  icon: '🏦',
                  name: 'DBS Vickers',
                  color: '#DC2626',
                  tagline: 'CDP-linked broker inside the DBS ecosystem',
                  cost: 'From 0.12% commission',
                  rating: 3.9,
                  keyFeature: 'Fully integrated with DBS/POSB banking — fund transfers are instant. CDP-linked for all SGX trades. Simple interface suited to occasional rather than active traders.',
                  bestFor: 'DBS or POSB account holders who want the simplest possible setup and prioritise CDP safety over low commissions.',
                  singaporeTip: 'DBS Vickers has a minimum commission of ~$10 per trade — this makes it expensive for small purchases under $5,000. Better suited for larger, less frequent trades.',
                },
                {
                  icon: '🌐',
                  name: 'Interactive Brokers',
                  color: '#7C3AED',
                  tagline: 'Institutional-grade platform for serious global investors',
                  cost: 'From 0.05% commission',
                  rating: 4.5,
                  keyFeature: 'Widest range of global markets and ETFs available to Singapore retail investors. Lowest commissions at higher volumes. Access to US, EU, and Asian markets in one account.',
                  bestFor: 'Experienced investors focused on global ETFs like VWRA or IWDA who want the lowest long-term costs and widest market access.',
                  singaporeTip: 'IBKR pays competitive interest on uninvested USD cash — useful if you hold USD between trades. The interface is more complex than Tiger or Moomoo, better suited to investors with some experience.',
                },
              ],
            },
            {
              type: 'scenarios',
              title: 'Which broker setup fits your situation?',
              scenarios: [
                {
                  icon: '🎓',
                  situation: 'You\'re a first-year international student with $300/month to invest. You want to buy an STI ETF regularly and keep costs as low as possible.',
                  options: [
                    {
                      text: 'Open Tiger Brokers — custodian, low commissions from 0.06%, easy app, no minimum deposit.',
                      biasLabel: 'Best fit ✓',
                      biasExplanation: 'For small monthly amounts, Tiger\'s low commissions minimise fee drag significantly. A CDP-linked broker with a $10 minimum commission would eat over 3% of a $300 purchase — devastating for a regular savings plan.',
                      isIdeal: true,
                    },
                    {
                      text: 'Open DBS Vickers — same bank ecosystem, familiar interface, CDP-linked for safety.',
                      biasLabel: 'High fees for small trades',
                      biasExplanation: 'DBS Vickers\' ~$10 minimum commission represents over 3% of a $300 investment. At this scale, fee drag would significantly erode your returns over time.',
                      isIdeal: false,
                    },
                    {
                      text: 'Wait until you have $5,000 saved before opening any account.',
                      biasLabel: 'Opportunity cost of waiting',
                      biasExplanation: 'Delaying to reduce fee percentages sacrifices compounding time. Starting with $300/month in a low-cost broker beats waiting — time in the market consistently outperforms timing the market.',
                      isIdeal: false,
                    },
                  ],
                },
                {
                  icon: '💼',
                  situation: 'You\'ve just started full-time work and want to build a long-term portfolio of individual Singapore blue-chip stocks — DBS, CapitaLand, Singtel. You plan to hold for 10+ years.',
                  options: [
                    {
                      text: 'Open POEMS — CDP-linked, shares go directly into your CDP account, legally yours for the long haul.',
                      biasLabel: 'Best fit for SGX blue chips ✓',
                      biasExplanation: 'For a 10+ year hold of individual stocks, CDP-linked is the right choice. Your shares are legally yours in CDP — safe regardless of what happens to POEMS over a decade.',
                      isIdeal: true,
                    },
                    {
                      text: 'Use Tiger Brokers — lower commissions even for individual Singapore stocks.',
                      biasLabel: 'Custodian risk for long holds',
                      biasExplanation: 'Lower fees are attractive, but for a 10+ year hold, CDP-linked is meaningfully safer. Custodian brokers hold shares in their own name — over a decade, broker risk becomes a real consideration.',
                      isIdeal: false,
                    },
                    {
                      text: 'Use Syfe instead — simpler and no need to pick individual stocks.',
                      biasLabel: 'Wrong tool for the goal',
                      biasExplanation: 'Robo-advisors build diversified portfolios — they don\'t let you pick individual stocks. If you specifically want DBS or Singtel shares, you need a direct brokerage account.',
                      isIdeal: false,
                    },
                  ],
                },
                {
                  icon: '🌍',
                  situation: 'You want to invest in globally diversified ETFs — VWRA or IWDA. You\'re comfortable with apps and want the lowest possible long-term fees.',
                  options: [
                    {
                      text: 'Open Interactive Brokers — widest global ETF access, lowest commissions at higher volumes.',
                      biasLabel: 'Best for serious global ETF investors ✓',
                      biasExplanation: 'IBKR offers the widest range of global ETFs at institutional-grade fees. For a VWRA or IWDA strategy investing regularly over years, the commission savings compound into thousands of dollars.',
                      isIdeal: true,
                    },
                    {
                      text: 'Use POEMS — you already have a CDP account there, keep everything in one place.',
                      biasLabel: 'Higher fees for global ETFs',
                      biasExplanation: 'CDP-linked brokers charge significantly more for globally-listed ETFs. Convenience shouldn\'t override long-term cost — the fee difference on a regular global ETF strategy compounds into thousands over a decade.',
                      isIdeal: false,
                    },
                    {
                      text: 'Use Moomoo — low fees, strong US access, beginner-friendly app.',
                      biasLabel: 'Strong runner-up',
                      biasExplanation: 'Moomoo is an excellent choice for global ETFs with low commissions and a clean interface. IBKR edges ahead at higher investment volumes, but Moomoo is the more beginner-friendly option and still very competitive.',
                      isIdeal: false,
                    },
                  ],
                },
              ],
            },

            // ─── Section 5: Watch Out For These ──────────────────
            { type: 'heading', text: 'Watch Out For These' },
            {
              type: 'text',
              text: 'Even with the right accounts open, a few common mistakes can cost you money or create unnecessary risk. These are the ones that trip up most first-time investors in Singapore.',
            },
            {
              type: 'flipcards',
              title: 'Common first-investor mistakes — tap to flip:',
              cards: [
                {
                  frontLabel: '❌ Mistake',
                  backLabel: '✅ Fix',
                  front: 'Opening a CDP-linked brokerage account and trying to trade before the CDP account is ready.',
                  back: 'Apply for your CDP account first — it takes 3–5 business days. Open your brokerage account in parallel, but wait for CDP approval before placing any trades. Plan ahead, not at the moment you want to buy.',
                  tag: 'CDP first, then trade',
                },
                {
                  frontLabel: '❌ Mistake',
                  backLabel: '✅ Fix',
                  front: 'Choosing a broker based on the best welcome bonus or sign-up promotion.',
                  back: 'Welcome bonuses are one-off. Commission rates apply to every trade for years. A broker charging 0.05% vs 0.20% saves hundreds annually on a regular investing plan — always prioritise long-term cost over short-term promotions.',
                  tag: 'Long-term cost beats short-term bonus',
                },
                {
                  frontLabel: '❌ Mistake',
                  backLabel: '✅ Fix',
                  front: 'Linking your daily spending account to your brokerage for cash settlement.',
                  back: 'T+2 settlement means cash leaves your bank 2 days after a trade. Link a dedicated savings account with a buffer — mixing with daily spending risks accidentally spending settlement funds and triggering a contra loss penalty.',
                  tag: 'Separate settlement from spending',
                },
                {
                  frontLabel: '❌ Mistake',
                  backLabel: '✅ Fix',
                  front: 'Using a CDP-linked broker for US and global ETFs and paying 3–5× more in commissions.',
                  back: 'CDP-linked brokers are best for long-term SGX stock holdings. For US or global ETFs like VWRA or VTI, custodian brokers offer dramatically lower commissions. Use the right broker for each market — the fee difference compounds significantly.',
                  tag: 'Right broker for each market',
                },
              ],
            },
            {
              type: 'slider',
              icon: '💸',
              title: 'Annual Commission Cost Calculator',
              description: 'Drag to your monthly investment amount to see how much you pay in annual commissions at a low-cost broker (0.06%) versus a standard broker (0.20%) — and what you save each year.',
              min: 100,
              max: 5000,
              step: 100,
              initialValue: 500,
              prefix: '$',
              calculateResult: (monthly) => {
                const annual = monthly * 12;
                const lowCostFee = annual * 0.0006;
                const standardFee = annual * 0.002;
                const saving = standardFee - lowCostFee;
                return [
                  { label: '✅ Low-cost broker (0.06%) — annual commission', value: `$${lowCostFee.toFixed(2)}`, color: '#059669' },
                  { label: '⚠️ Standard broker (0.20%) — annual commission', value: `$${standardFee.toFixed(2)}`, color: '#DC2626' },
                  { label: '💰 You save by choosing low-cost', value: `$${saving.toFixed(2)}/year`, color: '#4F46E5' },
                ];
              },
            },
          ],

          flashcards: [
            { q: 'What is a CDP account and what makes it different from a brokerage account?', a: 'A CDP account holds your Singapore-listed shares in your own name — it is your personal share safe, backed by SGX. A brokerage account is where you place trades. The broker executes the order; the CDP account stores the result.' },
            { q: 'What is the difference between a CDP-linked and a custodian broker?', a: 'CDP-linked brokers credit shares directly to your CDP account — legally yours and safe if the broker fails. Custodian brokers hold shares internally under their own name — lower cost, but shares may be at risk in a broker insolvency.' },
            { q: 'How long does it take to open a CDP account, and who is eligible?', a: '3–5 business days via the SGX website. It is free. International students on a valid Singapore student pass are eligible — you need to be 18+ and have a local Singapore bank account.' },
            { q: 'What does T+2 settlement mean and why does it matter?', a: 'Cash is debited from your linked bank account 2 business days after your trade executes. If your account has insufficient funds on settlement day, you face a contra loss penalty — always ensure funds are available.' },
            { q: 'Which type of broker is better for global ETFs like VWRA, and why?', a: 'Custodian brokers — Tiger Brokers, Moomoo, or Interactive Brokers — offer significantly lower commissions for US and globally-listed ETFs. CDP-linked brokers charge much more for non-SGX markets, so match your broker to your market.' },
          ],
          
          },
          { id: '8-2', title: 'STI ETF & Singapore Stocks', icon: '📊', topic: 'STI ETF Singapore Exchange stocks investing', duration: '6 min', fincoins: 90, sections: [{ key: 'sti', heading: 'What is the STI ETF?' }, { key: 'reits', heading: 'Singapore REITs' }, { key: 'blue', heading: 'Blue Chip Singapore Stocks' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What does the STI ETF track?', a: 'The Straits Times Index — Singapore\'s top 30 listed companies by market cap.' }] },
          { id: '8-3', title: 'Robo-Advisors in Singapore', icon: '🤖', topic: 'Syfe StashAway Endowus robo advisor Singapore', duration: '6 min', fincoins: 90, sections: [{ key: 'what', heading: 'What is a Robo-Advisor?' }, { key: 'options', heading: 'Syfe vs StashAway vs Endowus' }, { key: 'start', heading: 'Getting Started with $100' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the minimum investment for most Singapore robo-advisors?', a: 'As low as $1–$100 — Syfe and StashAway both allow very low minimums.' }] },
        ],
      },
      {
        id: 'chapter-9',
        title: 'Robo-Advisors & DCA',
        icon: '🔄',
        description: 'Automate investing and remove emotion from the equation',
        lessons: [
          { id: '9-1', title: 'Dollar-Cost Averaging', icon: '📅', topic: 'Dollar cost averaging DCA investing strategy', duration: '5 min', fincoins: 90, sections: [{ key: 'what', heading: 'What is DCA?' }, { key: 'why', heading: 'Why DCA Beats Timing the Market' }, { key: 'setup', heading: 'Setting Up Automatic DCA' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is dollar-cost averaging?', a: 'Investing a fixed amount at regular intervals — regardless of market price. Reduces impact of volatility.' }] },
          { id: '9-2', title: 'Investing with CPFIS', icon: '🏛️', topic: 'CPF Investment Scheme CPFIS OA SA invest', duration: '6 min', fincoins: 90, sections: [{ key: 'what', heading: 'What is CPFIS?' }, { key: 'eligible', heading: 'What You Can Invest In' }, { key: 'vs', heading: 'CPFIS vs Cash Investing' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the minimum OA balance before you can use CPFIS?', a: '$20,000 must remain in your OA before you can invest the rest via CPFIS.' }] },
          { id: '9-3', title: 'Avoiding Common Investing Mistakes', icon: '⚠️', topic: 'Common investing mistakes beginners Singapore', duration: '5 min', fincoins: 90, sections: [{ key: 'mistakes', heading: 'The 5 Biggest Beginner Mistakes' }, { key: 'crypto', heading: 'A Note on Crypto & Meme Stocks' }, { key: 'mindset', heading: 'Long-Term Investor Mindset' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the biggest mistake new investors make?', a: 'Timing the market — trying to buy low and sell high. Time IN the market consistently outperforms timing.' }] },
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
          { id: '10-1', title: 'What is CPF?', icon: '❓', topic: 'CPF Central Provident Fund basics Singapore', duration: '7 min', fincoins: 100, sections: [{ key: 'what', heading: 'What CPF Is and Why It Exists' }, { key: 'accounts', heading: 'The Four CPF Accounts' }, { key: 'international', heading: 'CPF for International Graduates' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What are the four CPF accounts?', a: 'Ordinary Account (OA), Special Account (SA), MediSave Account (MA), and Retirement Account (RA — created at 55).' }] },
          { id: '10-2', title: 'CPF Contribution Rates', icon: '💹', topic: 'CPF contribution rates employee employer Singapore', duration: '6 min', fincoins: 100, sections: [{ key: 'rates', heading: 'Employee & Employer Rates' }, { key: 'calc', heading: 'Calculating Your Contribution' }, { key: 'changes', heading: 'Rate Changes Over Your Career' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the total CPF contribution rate for employees under 55?', a: '37% of gross salary — 20% from employee, 17% from employer.' }] },
          { id: '10-3', title: 'CPF OA: Housing & Investments', icon: '🏠', topic: 'CPF Ordinary Account housing investment CPFIS', duration: '6 min', fincoins: 100, sections: [{ key: 'oa', heading: 'What Your OA Can Be Used For' }, { key: 'housing', heading: 'Using OA for HDB' }, { key: 'invest', heading: 'Investing Your OA' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What interest rate does the CPF OA earn?', a: '2.5% per annum — guaranteed by the Singapore government.' }] },
        ],
      },
      {
        id: 'chapter-11',
        title: 'Tax & Insurance',
        icon: '📋',
        description: 'Navigate Singapore\'s tax system and protect what you build',
        lessons: [
          { id: '11-1', title: 'Singapore Income Tax Basics', icon: '🧾', topic: 'Singapore income tax personal relief filing', duration: '7 min', fincoins: 100, sections: [{ key: 'how', heading: 'How Singapore Tax Works' }, { key: 'rates', heading: 'Tax Rates & Brackets' }, { key: 'relief', heading: 'Key Tax Reliefs to Claim' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the first tax bracket in Singapore?', a: 'The first $20,000 of chargeable income is taxed at 0% — Singapore has very low income tax.' }] },
          { id: '11-2', title: 'MediShield Life & Insurance', icon: '🏥', topic: 'MediShield Life insurance Singapore basics', duration: '6 min', fincoins: 100, sections: [{ key: 'medishield', heading: 'What MediShield Life Covers' }, { key: 'gap', heading: 'The Insurance Gap' }, { key: 'need', heading: 'What Insurance Do You Actually Need?' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What does MediShield Life cover?', a: 'Large hospital bills and selected outpatient treatments — all Singapore citizens and PRs are enrolled automatically.' }] },
          { id: '11-3', title: 'Tax Relief Through CPF Top-Ups', icon: '💡', topic: 'CPF top up tax relief SA Retirement Account Singapore', duration: '5 min', fincoins: 100, sections: [{ key: 'topup', heading: 'CPF Cash Top-Up Scheme' }, { key: 'relief', heading: 'Tax Relief Amounts' }, { key: 'strategy', heading: 'Optimising Your Top-Up Strategy' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'How much tax relief can you get from CPF cash top-ups?', a: 'Up to $8,000 for self top-up + $8,000 for family members = $16,000 total relief per year.' }] },
        ],
      },
      {
        id: 'chapter-12',
        title: 'Long-Term Financial Planning',
        icon: '🔭',
        description: 'Build a financial plan that spans decades, not months',
        lessons: [
          { id: '12-1', title: 'Planning for Your First Job', icon: '💼', topic: 'Financial planning first job Singapore graduate salary', duration: '7 min', fincoins: 110, sections: [{ key: 'salary', heading: 'Understanding Your Offer Letter' }, { key: 'first', heading: 'First Month Financial Checklist' }, { key: 'setup', heading: 'Setting Up Your Financial System' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is the median graduate starting salary in Singapore?', a: 'Around $3,500–$4,200/month for fresh graduates, varying by industry and university.' }] },
          { id: '12-2', title: 'Net Worth Tracking', icon: '📊', topic: 'Net worth calculation tracking personal finance Singapore', duration: '5 min', fincoins: 110, sections: [{ key: 'what', heading: 'What is Net Worth?' }, { key: 'calc', heading: 'Calculating Yours' }, { key: 'grow', heading: 'Growing Net Worth Over Time' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'How do you calculate net worth?', a: 'Total Assets (savings + investments + CPF + property) minus Total Liabilities (loans + credit card debt).' }] },
          { id: '12-3', title: 'Retirement Planning in Singapore', icon: '🌅', topic: 'CPF retirement planning Singapore BRS FRS ERS', duration: '7 min', fincoins: 110, sections: [{ key: 'cpflife', heading: 'CPF LIFE — Your Retirement Income' }, { key: 'targets', heading: 'BRS, FRS & ERS Explained' }, { key: 'plan', heading: 'Building Your Retirement Plan' }], content: [{ type: 'text', text: 'Content coming soon — check back after Module 1!' }], flashcards: [{ q: 'What is CPF LIFE?', a: 'A lifelong monthly payout scheme funded by your CPF Retirement Account — Singapore\'s version of an annuity.' }] },
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

export function getNextLesson(lessonId) {
  for (const mod of MODULES) {
    for (const chapter of mod.chapters) {
      const idx = chapter.lessons.findIndex(l => l.id === lessonId);
      if (idx !== -1 && idx < chapter.lessons.length - 1) {
        return chapter.lessons[idx + 1];
      }
    }
  }
  return null;
}