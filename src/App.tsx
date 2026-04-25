import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { billAuditData } from './data'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const ctPairIds = [2, 3]
const sectionIds = [1, 2, 3, 4, 5, 6] as const
type SectionId = (typeof sectionIds)[number]
const vocabItems = [
  {
    id: 'premium',
    term: 'Premium',
    definition: 'The amount you pay each month to keep your health insurance active.',
  },
  {
    id: 'deductible',
    term: 'Deductible',
    definition: 'The amount you pay out of pocket before insurance starts sharing costs.',
  },
  {
    id: 'copay',
    term: 'Copay',
    definition: 'A fixed dollar amount you pay for a visit or prescription.',
  },
  {
    id: 'coinsurance',
    term: 'Coinsurance',
    definition: 'The percentage of costs you pay after meeting your deductible.',
  },
  {
    id: 'in-network',
    term: 'In-network',
    definition: 'Doctors or facilities with lower negotiated prices in your insurance plan.',
  },
  {
    id: 'out-of-network',
    term: 'Out-of-network',
    definition: 'Providers not contracted with your plan, often costing much more.',
  },
  {
    id: 'eob',
    term: 'EOB',
    definition: 'Explanation of Benefits: a summary of what was billed, paid, and owed.',
  },
  {
    id: 'itemized-bill',
    term: 'Itemized bill',
    definition: 'A bill listing each individual charge, service, and code.',
  },
] as const
const eobFields = [
  { id: 'totalBilled', label: 'Total billed amount' },
  { id: 'allowedAmount', label: 'Allowed amount' },
  { id: 'planPaid', label: 'Plan paid' },
  { id: 'patientResponsibility', label: 'Patient responsibility' },
  { id: 'deductibleRemaining', label: 'Deductible remaining' },
] as const
const eobQuestions = [
  {
    id: 'owe',
    prompt: 'Click the field that shows what you actually owe.',
    correctField: 'patientResponsibility',
    explanation:
      'Patient responsibility is your share after insurance processes the claim. That is the amount you should expect to pay.',
  },
  {
    id: 'allowed',
    prompt: 'Find the allowed amount field.',
    correctField: 'allowedAmount',
    explanation:
      'Allowed amount is the negotiated price insurance recognizes. It is often lower than the original billed charge.',
  },
  {
    id: 'inflated',
    prompt: 'Which number is usually the most inflated starting number?',
    correctField: 'totalBilled',
    explanation:
      'The billed amount is often a sticker price before insurance discounts. It is usually higher than what gets paid.',
  },
  {
    id: 'plan',
    prompt: 'Which field shows what insurance paid?',
    correctField: 'planPaid',
    explanation:
      'Plan paid is the insurer contribution toward the claim. It helps explain how the remaining balance was calculated.',
  },
  {
    id: 'network',
    prompt: 'Which field should match your final amount due?',
    correctField: 'patientResponsibility',
    explanation:
      'Your final due amount should align with patient responsibility after adjustments. If it does not, ask for clarification.',
  },
] as const
const scenarioQuestions = [
  {
    id: 'anesthesia',
    prompt:
      'Your in-network hospital sends a $3,000 bill from an out-of-network anesthesiologist. Best move?',
    options: [
      { id: 'pay', label: 'Pay immediately so it does not go to collections' },
      { id: 'dispute', label: 'Call insurance and dispute, then file a complaint at cms.gov' },
      { id: 'ignore', label: 'Ignore it for now and wait for another bill' },
    ],
    correctOption: 'dispute',
    explanation:
      'Emergency care protections can limit surprise out-of-network bills. Disputing with insurance and filing a complaint builds the strongest case.',
  },
  {
    id: 'gfe',
    prompt: 'Your final bill is $580 above the Good Faith Estimate. Can you dispute?',
    options: [
      { id: 'yes', label: 'Yes, because it is at least $400 over the estimate' },
      { id: 'no', label: 'No, because bills are allowed to increase by any amount' },
      { id: 'maybe', label: 'Only if it is over by at least $1,000' },
    ],
    correctOption: 'yes',
    explanation:
      'A large gap above the estimate can trigger dispute rights. Crossing the $400 threshold is a key rule for that process.',
  },
  {
    id: 'payment',
    prompt: "You can't pay a $2,400 bill. First call should be to...",
    options: [
      { id: 'collections', label: 'A collections agency' },
      { id: 'hospitalBilling', label: 'The hospital billing office to ask about financial help' },
      { id: 'creditCard', label: 'A credit card company for a cash advance' },
    ],
    correctOption: 'hospitalBilling',
    explanation:
      'Billing offices can offer charity care or payment plans directly. Reaching out early gives you more options before the bill escalates.',
  },
  {
    id: 'eobCompare',
    prompt: 'Before paying, what should you compare first?',
    options: [
      { id: 'social', label: 'Advice in social media comments' },
      { id: 'docs', label: 'The itemized bill against the EOB' },
      { id: 'nothing', label: 'Nothing, just pay the amount shown' },
    ],
    correctOption: 'docs',
    explanation:
      'Comparing the bill and EOB can reveal duplicates or mismatches. This step helps you catch errors before paying.',
  },
  {
    id: 'network',
    prompt: 'A specialist is out-of-network. What is smartest before treatment if possible?',
    options: [
      { id: 'switch', label: 'Ask for an in-network provider or cost estimate first' },
      { id: 'hope', label: 'Use them anyway and hope insurance covers everything' },
      { id: 'skip', label: 'Skip all care even if urgent' },
    ],
    correctOption: 'switch',
    explanation:
      'Checking network status early can prevent major surprise costs. Asking for an estimate improves informed decisions.',
  },
  {
    id: 'charity',
    prompt: 'You qualify for help but cannot pay now. What is most useful first step?',
    options: [
      { id: 'charity', label: 'Ask for charity care or a no-interest payment plan' },
      { id: 'loan', label: 'Take a high-interest loan immediately' },
      { id: 'delay', label: 'Do nothing and wait for penalties' },
    ],
    correctOption: 'charity',
    explanation:
      'Financial assistance and payment plans can reduce pressure quickly. Starting with the billing office can prevent extra fees and stress.',
  },
] as const

function EobTable() {
  return (
    <div className="overflow-x-auto p-3">
      <table className="min-w-[640px] text-left text-base md:min-w-full">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="px-2 py-2 font-semibold">Item</th>
            <th className="px-2 py-2 font-semibold">Billed</th>
            <th className="px-2 py-2 font-semibold">Allowed</th>
            <th className="px-2 py-2 font-semibold">Plan Paid</th>
            <th className="px-2 py-2 font-semibold">Patient Resp</th>
          </tr>
        </thead>
        <tbody>
          {billAuditData.eobLineItems.map((item) => (
            <tr key={item.id} className="border-t border-slate-200 bg-white">
              <td className="min-w-0 px-2 py-2 font-medium text-slate-900">{item.description}</td>
              <td className="px-2 py-2 text-slate-700">
                {item.billed ? currency.format(item.billed) : '-'}
              </td>
              <td className="px-2 py-2 text-slate-700">{currency.format(item.allowed)}</td>
              <td className="px-2 py-2 text-slate-700">{currency.format(item.planPaid)}</td>
              <td className="px-2 py-2 font-semibold text-blue-900">
                {currency.format(item.patientResponsibility)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-blue-300 bg-blue-50">
            <td className="px-2 py-2 font-bold text-blue-900">Totals</td>
            <td className="px-2 py-2">-</td>
            <td className="px-2 py-2 font-bold text-blue-900">
              {currency.format(billAuditData.eobTotals.allowed)}
            </td>
            <td className="px-2 py-2 font-bold text-blue-900">
              {currency.format(billAuditData.eobTotals.planPaid)}
            </td>
            <td className="px-2 py-2 font-bold text-blue-900">
              {currency.format(billAuditData.eobTotals.patientResponsibility)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<0 | SectionId>(0)
  const [flaggedLineItemIds, setFlaggedLineItemIds] = useState<number[]>([])
  const [didSubmitErrors, setDidSubmitErrors] = useState(false)
  const [enteredOweAmount, setEnteredOweAmount] = useState('')
  const [didSubmitMath, setDidSubmitMath] = useState(false)
  const [selectedAssistanceIds, setSelectedAssistanceIds] = useState<number[]>([])
  const [didSubmitAssistance, setDidSubmitAssistance] = useState(false)
  const [vocabSelections, setVocabSelections] = useState<Record<string, string>>({})
  const [didSubmitVocab, setDidSubmitVocab] = useState(false)
  const [eobSelections, setEobSelections] = useState<Record<string, string>>({})
  const [didSubmitEobDetective, setDidSubmitEobDetective] = useState(false)
  const [scenarioSelections, setScenarioSelections] = useState<Record<string, string>>({})

  const distinctErrorGroups = useMemo(
    () => [
      { key: 'ct-duplicate', label: 'CT Scan Head w/o Contrast', ids: ctPairIds, errorId: 3 },
      { key: 'anesthesia', label: 'Anesthesiologist (Out-of-Network)', ids: [5], errorId: 5 },
      { key: 'room-upgrade', label: 'Deluxe Private Room Upgrade (3 days)', ids: [7], errorId: 7 },
    ],
    [],
  )

  const nonErrorItems = useMemo(
    () => billAuditData.billLineItems.filter((item) => !item.isError && !ctPairIds.includes(item.id)),
    [],
  )

  const flaggedSet = useMemo(() => new Set(flaggedLineItemIds), [flaggedLineItemIds])
  const foundGroups = distinctErrorGroups.filter((group) =>
    group.ids.some((id) => flaggedSet.has(id)),
  )
  const missedGroups = distinctErrorGroups.filter(
    (group) => !group.ids.some((id) => flaggedSet.has(id)),
  )
  const wronglyFlaggedItems = nonErrorItems.filter((item) => flaggedSet.has(item.id))

  const correctFlags = foundGroups.length
  const falsePositives = wronglyFlaggedItems.length
  const parsedAmount = Number(enteredOweAmount)
  const isMathCorrect = Math.abs(parsedAmount - billAuditData.eobTotals.patientResponsibility) <= 5
  const vocabCorrectCount = vocabItems.filter(
    (item) => vocabSelections[item.id] === item.definition,
  ).length
  const missedVocab = vocabItems.filter((item) => vocabSelections[item.id] !== item.definition)
  const eobCorrectCount = eobQuestions.filter(
    (question) => eobSelections[question.id] === question.correctField,
  ).length

  const toggleFlag = (id: number) => {
    setFlaggedLineItemIds((current) =>
      current.includes(id) ? current.filter((lineId) => lineId !== id) : [...current, id],
    )
  }

  const toggleAssistanceOption = (id: number) => {
    setSelectedAssistanceIds((current) =>
      current.includes(id) ? current.filter((optionId) => optionId !== id) : [...current, id],
    )
  }

  const handleMathSubmit = (event: FormEvent) => {
    event.preventDefault()
    setDidSubmitMath(true)
  }
  const handleVocabSelect = (termId: string, definition: string) => {
    setVocabSelections((current) => ({ ...current, [termId]: definition }))
  }
  const handleScenarioQuestionSelect = (questionId: string, optionId: string) => {
    setScenarioSelections((current) => ({ ...current, [questionId]: optionId }))
  }

  const handleStartOver = () => {
    setScreen(1)
    setFlaggedLineItemIds([])
    setDidSubmitErrors(false)
    setEnteredOweAmount('')
    setDidSubmitMath(false)
    setSelectedAssistanceIds([])
    setDidSubmitAssistance(false)
    setVocabSelections({})
    setDidSubmitVocab(false)
    setEobSelections({})
    setDidSubmitEobDetective(false)
    setScenarioSelections({})
  }

  const primaryButtonClass =
    'min-h-11 rounded-xl bg-blue-800 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow'
  const secondaryButtonClass =
    'min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:bg-slate-100'
  const sectionName =
    screen === 1
      ? 'Spot the Errors'
      : screen === 2
        ? 'Do the Math'
        : screen === 3
          ? 'Apply the Tools'
          : screen === 4
            ? 'Vocab Match-Up'
            : screen === 5
              ? 'EOB Detective'
              : screen === 6
                ? 'What Would You Do?'
                : 'Ready to Begin'

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 rounded-2xl border border-blue-200/80 bg-white/95 p-5 shadow-sm backdrop-blur md:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex min-h-11 items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold uppercase tracking-wide text-blue-800">
            High-School Health Literacy Activity
          </p>
          <p className="text-base font-semibold text-slate-600">
            {screen === 0 ? 'Ready to Begin' : sectionName}
          </p>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-blue-900 md:text-4xl">
          {billAuditData.title}
        </h1>
        <p className="mt-2 text-base text-slate-700">
          Teams of 3-4: audit this hospital bill, compare it to the EOB, and decide what the
          patient truly owes.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur md:p-7">
        {screen > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-base font-semibold text-slate-600">Activity Progress</p>
              <p className="text-base font-semibold text-blue-800">Section {screen} of 6</p>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-700 transition-all"
                style={{ width: `${(screen / 6) * 100}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {sectionIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScreen(id)}
                  className={`min-h-11 rounded-lg px-3 py-2 text-base font-semibold ${
                    screen === id
                      ? 'bg-blue-800 text-white'
                      : 'border border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  Section {id}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 0 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Welcome</h2>
            <p className="text-base text-slate-700">
              Use one device per team. Work through all six sections, then discuss your takeaways.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-base text-slate-700">
              <p className="font-semibold text-slate-900">Live URL:</p>
              <a
                href="https://decodedactivities.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="break-all text-blue-800 underline"
              >
                https://decodedactivities.vercel.app
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sectionIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScreen(id)}
                  className={id === 1 ? primaryButtonClass : secondaryButtonClass}
                >
                  Go to Section {id}
                </button>
              ))}
            </div>
          </div>
        )}

        {screen === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Screen 1 - Spot the Errors</h2>
            <p className="text-base text-slate-700">
              Tap any hospital bill row you think is an error, then submit to check your work.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                  <h3 className="text-lg font-semibold text-blue-900">Hospital Bill</h3>
                  <p className="text-base text-slate-700">
                    Total billed: {currency.format(billAuditData.billTotal)}
                  </p>
                </div>
                <ul className="p-3">
                  {billAuditData.billLineItems.map((item) => {
                    const isFlagged = flaggedLineItemIds.includes(item.id)
                    const rowBase =
                      'mb-2 w-full rounded-xl border p-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 min-h-11'
                    const stateStyles = isFlagged
                      ? 'border-blue-700 bg-blue-100 shadow-sm'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300'

                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => toggleFlag(item.id)}
                          className={`${rowBase} ${stateStyles}`}
                          aria-pressed={isFlagged}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="min-w-0 font-semibold text-slate-900">{item.description}</p>
                            <p className="font-bold text-blue-900">{currency.format(item.amount)}</p>
                          </div>
                          <p className="mt-1 text-base text-slate-700">
                            CPT: {item.cpt ?? 'No CPT listed'}
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </article>

              <article className="rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                  <h3 className="text-lg font-semibold text-blue-900">Explanation of Benefits</h3>
                  <p className="text-base text-slate-700">Legitimate claims processed by the plan</p>
                </div>
                <EobTable />
              </article>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setDidSubmitErrors(true)}
                className={primaryButtonClass}
              >
                Submit Error Flags
              </button>
            </div>

            {didSubmitErrors && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                {correctFlags === 3 && falsePositives === 0 && (
                  <p className="font-semibold text-blue-900">You found all 3 errors. Great audit.</p>
                )}
                {correctFlags > 0 && correctFlags < 3 && falsePositives === 0 && (
                  <div>
                    <p className="font-semibold text-blue-900">
                      You found {correctFlags} of 3 errors.
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">Missed:</p>
                    <ul className="mt-1 space-y-2 text-base text-slate-800">
                      {missedGroups.map((group) => {
                        const errorItem = billAuditData.billLineItems.find(
                          (item) => item.id === group.errorId,
                        )
                        return (
                          <li key={group.key}>
                            <span className="font-semibold">{group.label}:</span>{' '}
                            {errorItem?.errorExplanation}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                {correctFlags > 0 && falsePositives > 0 && (
                  <div>
                    <p className="font-semibold text-blue-900">
                      You found {correctFlags} of 3 errors, but also flagged {falsePositives}{' '}
                      legitimate charge(s).
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">Missed:</p>
                    <ul className="mt-1 space-y-2 text-base text-slate-800">
                      {missedGroups.length === 0 ? (
                        <li>None.</li>
                      ) : (
                        missedGroups.map((group) => {
                          const errorItem = billAuditData.billLineItems.find(
                            (item) => item.id === group.errorId,
                          )
                          return (
                            <li key={group.key}>
                              <span className="font-semibold">{group.label}:</span>{' '}
                              {errorItem?.errorExplanation}
                            </li>
                          )
                        })
                      )}
                    </ul>
                    <p className="mt-2 text-base font-semibold text-slate-900">Wrongly flagged:</p>
                    <ul className="mt-1 space-y-2 text-base text-slate-800">
                      {wronglyFlaggedItems.map((item) => (
                        <li key={item.id}>
                          <span className="font-semibold">{item.description}:</span>{' '}
                          {item.legitimateExplanation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {correctFlags === 0 && (
                  <div>
                    <p className="font-semibold text-blue-900">
                      You didn&apos;t flag any errors, but there are 3 on this bill.
                    </p>
                    <p className="mt-2 text-base font-semibold text-slate-900">
                      Here&apos;s what to look for:
                    </p>
                    <ul className="mt-1 space-y-2 text-base text-slate-800">
                      {distinctErrorGroups.map((group) => {
                        const errorItem = billAuditData.billLineItems.find(
                          (item) => item.id === group.errorId,
                        )
                        return (
                          <li key={group.key}>
                            <span className="font-semibold">{group.label}:</span>{' '}
                            {errorItem?.errorExplanation}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {screen === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Screen 2 - Do the Math</h2>
            <p className="text-lg text-slate-800">
              Based on the EOB, what does the patient actually owe?
            </p>
            <article className="rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                <h3 className="text-lg font-semibold text-blue-900">EOB Reference</h3>
                <p className="text-base text-slate-700">Use this while calculating</p>
              </div>
              <EobTable />
            </article>
            <form
              onSubmit={handleMathSubmit}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-end"
            >
              <label className="text-base font-semibold text-slate-700" htmlFor="owedAmount">
                Enter amount in dollars
              </label>
              <input
                id="owedAmount"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={enteredOweAmount}
                onChange={(event) => setEnteredOweAmount(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 sm:w-64"
                placeholder="Enter amount"
              />
              <button
                type="submit"
                className={primaryButtonClass}
              >
                Submit
              </button>
            </form>

            {didSubmitMath && (
              <div
                className={`rounded-lg border p-4 ${
                  isMathCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
                }`}
              >
                <p className="font-semibold text-slate-900">
                  {isMathCorrect ? 'Correct.' : 'Not quite.'}
                </p>
                <p className="mt-1 text-slate-800">
                  Patient responsibility column on the EOB totals $850 - that's the real amount
                  owed, not the $4,820 the hospital billed.
                </p>
              </div>
            )}
          </div>
        )}

        {screen === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Screen 3 - Apply the Tools</h2>
            <p className="text-slate-700">
              Before paying anything, what actions should this patient take to reduce costs and challenge unfair charges?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {billAuditData.assistanceOptions.map((option) => {
                const selected = selectedAssistanceIds.includes(option.id)
                return (
                  <label
                    key={option.id}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      selected
                        ? 'border-blue-700 bg-blue-100 shadow-sm'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleAssistanceOption(option.id)}
                      className="mt-1 h-5 w-5 accent-blue-700"
                    />
                    <span className="min-w-0 font-medium text-slate-900">
                      {option.id}. {option.label}
                    </span>
                  </label>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setDidSubmitAssistance(true)}
              className={primaryButtonClass}
            >
              Submit
            </button>

            {didSubmitAssistance && (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="font-semibold text-blue-900">
                  You selected {selectedAssistanceIds.length}/5 options.
                </p>
                {selectedAssistanceIds.length === 5 ? (
                  <p className="text-slate-800">
                    5/5. Nice work - all five can be useful tools depending on the patient&apos;s
                    situation.
                  </p>
                ) : (
                  <p className="text-slate-800">
                    Good start. The options you picked are useful, and the missing ones may also
                    help depending on the situation.
                  </p>
                )}

                <div>
                  <p className="text-base font-semibold text-slate-900">Your selected options:</p>
                  <ul className="mt-1 space-y-1 text-base text-slate-800">
                    {selectedAssistanceIds.length === 0 ? (
                      <li>No options selected yet.</li>
                    ) : (
                      billAuditData.assistanceOptions
                        .filter((option) => selectedAssistanceIds.includes(option.id))
                        .map((option) => (
                          <li key={option.id}>
                            <span className="font-semibold">
                              {option.id}. {option.label}:
                            </span>{' '}
                            {option.explanation}
                          </li>
                        ))
                    )}
                  </ul>
                </div>

                {selectedAssistanceIds.length < 5 && (
                  <div>
                    <p className="text-base font-semibold text-slate-900">Also consider:</p>
                    <ul className="mt-1 space-y-1 text-base text-slate-800">
                      {billAuditData.assistanceOptions
                        .filter((option) => !selectedAssistanceIds.includes(option.id))
                        .map((option) => (
                          <li key={option.id}>
                            <span className="font-semibold">
                              {option.id}. {option.label}:
                            </span>{' '}
                            {option.explanation}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                <p className="pt-2 text-slate-900">
                  If this were your real bill, what would be the first thing you check?
                </p>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="mt-2 min-h-11 rounded-xl border border-blue-300 bg-white px-4 py-2 font-semibold text-blue-900 transition hover:bg-blue-100"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        )}

        {screen === 4 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Section 4 - Vocab Match-Up</h2>
            <p className="text-base text-slate-700">
              Match each vocabulary term to the best plain-English definition.
            </p>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              {vocabItems.map((item) => (
                <div key={item.id} className="grid gap-2 sm:grid-cols-2">
                  <p className="text-base font-semibold text-slate-900">{item.term}</p>
                  <select
                    value={vocabSelections[item.id] ?? ''}
                    onChange={(event) => handleVocabSelect(item.id, event.target.value)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    <option value="">Select a definition</option>
                    {vocabItems.map((definitionItem) => (
                      <option key={definitionItem.id} value={definitionItem.definition}>
                        {definitionItem.definition}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              <button type="button" onClick={() => setDidSubmitVocab(true)} className={primaryButtonClass}>
                Check Answers
              </button>
            </div>
            {didSubmitVocab && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-base font-semibold text-blue-900">Score: {vocabCorrectCount} / 8</p>
                {missedVocab.length > 0 && (
                  <ul className="mt-2 space-y-2 text-base text-slate-800">
                    {missedVocab.map((item) => (
                      <li key={item.id}>
                        <span className="font-semibold">{item.term}:</span> {item.definition}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {screen === 5 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Section 5 - EOB Detective</h2>
            <p className="text-base text-slate-700">
              Read the sample fields and answer the click questions.
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-base font-semibold text-slate-900">Sample EOB fields</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {eobFields.map((field) => (
                  <div key={field.id} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-800">
                    {field.label}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {eobQuestions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-semibold text-slate-900">
                    {index + 1}. {question.prompt}
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {eobFields.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() =>
                          setEobSelections((current) => ({ ...current, [question.id]: field.id }))
                        }
                        className={`min-h-11 rounded-lg border px-3 py-2 text-left text-base ${
                          eobSelections[question.id] === field.id
                            ? 'border-blue-700 bg-blue-100 text-slate-900'
                            : 'border-slate-300 bg-white text-slate-800'
                        }`}
                      >
                        {field.label}
                      </button>
                    ))}
                  </div>
                  {didSubmitEobDetective && (
                    <p className="mt-2 text-base text-slate-800">{question.explanation}</p>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDidSubmitEobDetective(true)} className={primaryButtonClass}>
              Check Answers
            </button>
            {didSubmitEobDetective && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-base font-semibold text-blue-900">
                  Score: {eobCorrectCount} / {eobQuestions.length}
                </p>
              </div>
            )}
          </div>
        )}

        {screen === 6 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Section 6 - What Would You Do?</h2>
            <p className="text-base text-slate-700">
              Choose the best answer for each scenario. Feedback explains why.
            </p>
            <div className="space-y-3">
              {scenarioQuestions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-base font-semibold text-slate-900">
                    {index + 1}. {question.prompt}
                  </p>
                  <div className="mt-2 space-y-2">
                    {question.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleScenarioQuestionSelect(question.id, option.id)}
                        className={`min-h-11 w-full rounded-lg border px-3 py-2 text-left text-base ${
                          scenarioSelections[question.id] === option.id
                            ? 'border-blue-700 bg-blue-100 text-slate-900'
                            : 'border-slate-300 bg-white text-slate-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {scenarioSelections[question.id] && (
                    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-base font-semibold text-blue-900">
                        {scenarioSelections[question.id] === question.correctOption
                          ? 'Nice choice.'
                          : 'Try this approach instead.'}
                      </p>
                      <p className="mt-1 text-base text-slate-800">{question.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {screen > 0 && (
          <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setScreen((current) => (current <= 1 ? 1 : ((current - 1) as SectionId)))}
            disabled={screen === 1}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <p className="order-3 w-full text-center text-base font-semibold text-slate-600 sm:order-none sm:w-auto">
            Section {screen} of 6
          </p>
          {screen === 3 && didSubmitAssistance ? (
            <button
              type="button"
              onClick={handleStartOver}
              className={`${primaryButtonClass} px-4`}
            >
              Start Over
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setScreen((current) =>
                  current >= 6 ? 6 : ((current + 1) as SectionId),
                )
              }
              disabled={screen === 6}
              className={`${primaryButtonClass} px-4 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Next
            </button>
          )}
          </nav>
        )}
      </section>
    </main>
  )
}

export default App
