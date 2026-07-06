type Props = {
  answers: Record<string, unknown>
}

export const AnswerList = ({ answers }: Props) => {
  const entries = Object.entries(answers)

  if (entries.length === 0) {
    return <p className="text-sm text-foreground-secondary">답변이 없습니다.</p>
  }

  return (
    <dl className="space-y-4">
      {entries.map(([question, answer]) => (
        <div key={question} className="space-y-1">
          <dt className="text-sm font-semibold text-foreground">{question}</dt>
          <dd className="whitespace-pre-wrap rounded-lg bg-default-100 px-3 py-2 text-sm text-foreground">
            {typeof answer === "string" ? answer : JSON.stringify(answer)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
