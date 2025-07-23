export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            本利用規約（以下「本規約」）は、jt-chihara（以下「当方」）が提供する割り勘アプリ「warikan」（以下「本サービス」）の利用条件を定めるものです。
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（適用）</h2>
            <p className="text-gray-700 mb-4">
              本規約は、ユーザーと当方との間の本サービスの利用に関わる一切の関係に適用されるものとします。
            </p>
            <p className="text-gray-700">
              当方は本サービスに関し、本規約のほか、ご利用にあたってのルール等、各種の定め（以下「個別規定」）をすることがあります。これら個別規定はその名称のいかんに関わらず、本規約の一部を構成するものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（利用登録）</h2>
            <p className="text-gray-700">
              本サービスは利用登録を必要とせず、どなたでも自由にご利用いただけます。ただし、本規約に同意いただいた方のみが本サービスをご利用いただけるものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（禁止事項）</h2>
            <p className="text-gray-700 mb-4">
              ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>
                本サービスの内容等、本サービスに含まれる著作権、商標権その他の知的財産権を侵害する行為
              </li>
              <li>
                当方、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為
              </li>
              <li>本サービスによって得られた情報を商業的に利用する行為</li>
              <li>当方のサービスの運営を妨害するおそれのある行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正な目的を持って本サービスを利用する行為</li>
              <li>
                本サービスの他のユーザーまたはその他の第三者に不利益、損害、不快感を与える行為
              </li>
              <li>その他当方が不適切と判断する行為</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              第4条（本サービスの提供の停止等）
            </h2>
            <p className="text-gray-700 mb-4">
              当方は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
              <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
              <li>
                地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合
              </li>
              <li>コンピュータまたは通信回線等が事故により停止した場合</li>
              <li>その他、当方が本サービスの提供が困難と判断した場合</li>
            </ul>
            <p className="text-gray-700">
              当方は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（著作権）</h2>
            <p className="text-gray-700">
              ユーザーは、自ら著作権等の必要な知的財産権を有するか、または必要な権利者の許諾を得た文章、画像や映像等の情報に関してのみ、本サービスを利用し、投稿ないしアップロードすることができるものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（免責事項）</h2>
            <div className="text-gray-700 space-y-4">
              <p>
                当方は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
              </p>
              <p>
                当方は、本サービスに起因してユーザーに生じたあらゆる損害について、当方の故意又は重過失による場合を除き、一切の責任を負いません。ただし、本サービスに関する当方とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
              </p>
              <p>
                前項ただし書に定める場合であっても、当方は、当方の過失（重過失を除きます。）による債務不履行または不法行為によりユーザーに生じた損害のうち特別な事情から生じた損害（当方またはユーザーが損害発生につき予見し、または予見し得た場合を含みます。）について一切の責任を負いません。
              </p>
              <p>
                当方は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              第7条（サービス内容の変更等）
            </h2>
            <p className="text-gray-700">
              当方は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれに同意するものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第8条（利用規約の変更）</h2>
            <p className="text-gray-700">
              当方は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mt-4">
              <li>本規約の変更がユーザーの一般の利益に適合するとき</li>
              <li>
                本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第9条（個人情報の取扱い）</h2>
            <p className="text-gray-700">
              当方は、本サービスの利用によって取得する個人情報については、適切に取り扱うものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第10条（通知または連絡）</h2>
            <p className="text-gray-700">
              ユーザーと当方との間の通知または連絡は、当方の定める方法によって行うものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              第11条（権利義務の譲渡の禁止）
            </h2>
            <p className="text-gray-700">
              ユーザーは、当方の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              第12条（準拠法・裁判管轄）
            </h2>
            <p className="text-gray-700">
              本規約の解釈にあたっては、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、当方の本店所在地を管轄する裁判所を専属的合意管轄とします。
            </p>
          </section>

          <div className="text-right text-gray-600 mt-12">
            <p>制定日：2025年7月23日</p>
            <p>最終更新日：2025年7月23日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
