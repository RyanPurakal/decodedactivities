import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { billAuditData } from './data'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const ctPairIds = [2, 3]

function EobTable() {
  return (
    <div className="overflow-x-auto p-3">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
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
              <td className="px-2 py-2 font-medium text-slate-900">{item.description}</td>
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
  const [screen, setScreen] = useState(0)
  const [flaggedLineItemIds, setFlaggedLineItemIds] = useState<number[]>([])
  const [didSubmitErrors, setDidSubmitErrors] = useState(false)
  const [enteredOweAmount, setEnteredOweAmount] = useState('')
  const [didSubmitMath, setDidSubmitMath] = useState(false)
  const [selectedAssistanceIds, setSelectedAssistanceIds] = useState<number[]>([])
  const [didSubmitAssistance, setDidSubmitAssistance] = useState(false)

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

  const handleStartOver = () => {
    setScreen(1)
    setFlaggedLineItemIds([])
    setDidSubmitErrors(false)
    setEnteredOweAmount('')
    setDidSubmitMath(false)
    setSelectedAssistanceIds([])
    setDidSubmitAssistance(false)
  }

  const primaryButtonClass =
    'min-h-11 rounded-xl bg-blue-800 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow'

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <header className="mb-6 rounded-2xl border border-blue-200/80 bg-white/95 p-5 shadow-sm backdrop-blur md:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800 md:text-sm">
            High-School Health Literacy Activity
          </p>
          <p className="text-sm font-semibold text-slate-600">
            {screen === 0 ? 'Ready to Begin' : `Screen ${screen} of 3`}
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
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-600">Progress</p>
              <p className="text-sm font-semibold text-blue-800">Screen {screen} of 3</p>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-blue-700 transition-all"
                style={{ width: `${(screen / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {screen === 0 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Welcome</h2>
            <p className="text-slate-700">
              Use one device per team. Work through all three screens, then discuss your takeaways.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Projected URL (update after deploy):</p>
              <p>https://decodedactivities.vercel.app</p>
            </div>
            <button type="button" onClick={() => setScreen(1)} className={primaryButtonClass}>
              Start Activity
            </button>
          </div>
        )}

        {screen === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-blue-900 md:text-3xl">Screen 1 - Spot the Errors</h2>
            <p className="text-slate-700">
              Tap any hospital bill row you think is an error, then submit to check your work.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-slate-50/60">
                <div className="border-b border-slate-200 bg-blue-50 px-4 py-3">
                  <h3 className="text-lg font-semibold text-blue-900">Hospital Bill</h3>
                  <p className="text-sm text-slate-700">
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
                            <p className="font-semibold text-slate-900">{item.description}</p>
                            <p className="font-bold text-blue-900">{currency.format(item.amount)}</p>
                          </div>
                          <p className="mt-1 text-sm text-slate-700">
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
                  <p className="text-sm text-slate-700">Legitimate claims processed by the plan</p>
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
                    <p className="mt-2 text-sm font-semibold text-slate-900">Missed:</p>
                    <ul className="mt-1 space-y-2 text-sm text-slate-800">
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
                    <p className="mt-2 text-sm font-semibold text-slate-900">Missed:</p>
                    <ul className="mt-1 space-y-2 text-sm text-slate-800">
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
                    <p className="mt-2 text-sm font-semibold text-slate-900">Wrongly flagged:</p>
                    <ul className="mt-1 space-y-2 text-sm text-slate-800">
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
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      Here&apos;s what to look for:
                    </p>
                    <ul className="mt-1 space-y-2 text-sm text-slate-800">
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
                <p className="text-sm text-slate-700">Use this while calculating</p>
              </div>
              <EobTable />
            </article>
            <form
              onSubmit={handleMathSubmit}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-end"
            >
              <label className="text-sm font-semibold text-slate-700" htmlFor="owedAmount">
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
                className="min-h-11 w-56 rounded-lg border border-slate-300 px-3 py-2 text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
            <div className="grid gap-3 md:grid-cols-2">
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
                    <span className="font-medium text-slate-900">
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
                  <p className="text-sm font-semibold text-slate-900">Your selected options:</p>
                  <ul className="mt-1 space-y-1 text-slate-800">
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
                    <p className="text-sm font-semibold text-slate-900">Also consider:</p>
                    <ul className="mt-1 space-y-1 text-slate-800">
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

        {screen > 0 && (
          <nav className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={() => setScreen((current) => Math.max(1, current - 1))}
            disabled={screen === 1}
            className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <p className="text-sm font-semibold text-slate-600">Screen {screen} of 3</p>
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
              onClick={() => setScreen((current) => Math.min(3, current + 1))}
              disabled={screen === 3}
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
