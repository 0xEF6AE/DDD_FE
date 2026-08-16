import { isApplicationAttachment } from "@ddd/api"

import { AttachmentAnswer } from "./AttachmentAnswer"

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
          {/* answers 는 자유 폼이라 텍스트 답변과 PDF 첨부 객체가 같은 맵에 섞인다 */}
          {isApplicationAttachment(answer) ? (
            <dd>
              <AttachmentAnswer attachment={answer} />
            </dd>
          ) : (
            <dd className="whitespace-pre-wrap rounded-lg bg-default-100 px-3 py-2 text-sm text-foreground">
              {typeof answer === "string" ? answer : JSON.stringify(answer)}
            </dd>
          )}
        </div>
      ))}
    </dl>
  )
}
