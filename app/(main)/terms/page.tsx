import { Header } from '@/components/layout/Header';

export const metadata = {
  title: '이용약관 | 하이킹메이트',
  description: '하이킹메이트의 이용약관을 확인하세요.',
};

export default function TermsOfServicePage() {
  return (
    <>
      <Header title="이용약관" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">이용약관</h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-gray-600 mb-8">
              최종 수정일: {new Date().toLocaleDateString('ko-KR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제1조 (목적)</h2>
              <p className="text-gray-700">
                본 약관은 하이킹메이트(이하 "서비스")가 제공하는 등산 정보 서비스 및 관련 제반 서비스의
                이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을
                목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제2조 (용어의 정의)</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-3">
                <li>
                  <strong>"서비스"</strong>란 하이킹메이트가 제공하는 등산로 정보, GPS 산행 기록,
                  커뮤니티 및 기타 관련 서비스를 의미합니다.
                </li>
                <li>
                  <strong>"회원"</strong>이란 본 약관에 동의하고 회원가입을 완료하여 서비스를 이용하는
                  자를 의미합니다.
                </li>
                <li>
                  <strong>"게시물"</strong>이란 회원이 서비스를 이용함에 있어 게시한 글, 사진, 동영상 및
                  각종 파일과 링크 등을 의미합니다.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제3조 (약관의 효력 및 변경)</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.</li>
                <li>
                  회사는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있으며,
                  변경된 약관은 서비스 내 공지사항을 통해 공지합니다.
                </li>
                <li>
                  회원이 변경된 약관에 동의하지 않는 경우, 회원은 서비스 이용을 중단하고 탈퇴할 수 있습니다.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제4조 (회원가입)</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>
                  회원가입은 이용자가 본 약관과 개인정보 처리방침에 동의하고, 회사가 정한 절차에 따라
                  회원가입 신청을 완료함으로써 이루어집니다.
                </li>
                <li>
                  회사는 다음 각 호에 해당하는 경우 회원가입을 거부하거나 승인을 유보할 수 있습니다:
                  <ul className="list-disc list-inside mt-2 ml-6 space-y-1">
                    <li>실명이 아니거나 타인의 정보를 도용한 경우</li>
                    <li>허위 정보를 기재한 경우</li>
                    <li>기타 회원으로 등록하는 것이 서비스의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제5조 (서비스의 제공 및 변경)</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>
                  회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="list-disc list-inside mt-2 ml-6 space-y-1">
                    <li>전국 등산로 정보 제공</li>
                    <li>GPS 기반 산행 기록 서비스</li>
                    <li>등산 커뮤니티 서비스</li>
                    <li>등산 관련 정보 공유 및 교류</li>
                    <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                  </ul>
                </li>
                <li>
                  회사는 필요한 경우 서비스의 내용을 변경할 수 있으며, 중대한 변경의 경우 사전에 공지합니다.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제6조 (서비스의 중단)</h2>
              <p className="text-gray-700 mb-4">
                회사는 다음 각 호에 해당하는 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우</li>
                <li>정전, 제반 설비의 장애 또는 이용량의 폭주 등으로 정상적인 서비스 이용에 지장이 있는 경우</li>
                <li>서비스 제공업자와의 계약 종료 등과 같은 회사의 제반 사정으로 서비스를 유지할 수 없는 경우</li>
                <li>기타 천재지변, 국가비상사태 등 불가항력적 사유가 있는 경우</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제7조 (회원의 의무)</h2>
              <p className="text-gray-700 mb-4">회원은 다음 각 호의 행위를 하여서는 안 됩니다:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>회원가입 신청 또는 회원정보 변경 시 허위내용 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                <li>회사의 동의 없이 영리를 목적으로 서비스를 사용하는 행위</li>
                <li>기타 불법적이거나 부당한 행위</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제8조 (게시물의 관리)</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>
                  회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다.
                </li>
                <li>
                  회원이 서비스 내에 게시하는 게시물은 검색결과 내지 서비스 및 관련 프로모션 등에 노출될 수 있으며,
                  해당 노출을 위해 필요한 범위 내에서는 일부 수정, 복제, 편집되어 게시될 수 있습니다.
                </li>
                <li>
                  회사는 다음 각 호에 해당하는 게시물이나 자료를 사전통지 없이 삭제하거나 이동 또는 등록 거부할 수 있습니다:
                  <ul className="list-disc list-inside mt-2 ml-6 space-y-1">
                    <li>다른 회원 또는 제3자에게 심한 모욕을 주거나 명예를 손상시키는 내용인 경우</li>
                    <li>공공질서 및 미풍양속에 위반되는 내용을 유포하거나 링크시키는 경우</li>
                    <li>불법복제 또는 해킹을 조장하는 내용인 경우</li>
                    <li>영리를 목적으로 하는 광고일 경우</li>
                    <li>범죄와 결부된다고 객관적으로 인정되는 내용일 경우</li>
                    <li>회사의 저작권, 제3자의 저작권 등 기타 권리를 침해하는 내용인 경우</li>
                    <li>기타 관계 법령에 위배된다고 판단되는 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제9조 (면책조항)</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>
                  회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
                </li>
                <li>
                  회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.
                </li>
                <li>
                  회사는 회원이 서비스를 이용하여 기대하는 등산 정보의 정확성, 신뢰성에 대해 보증하지 않습니다.
                  등산은 위험을 수반하는 활동이므로, 회원은 본인의 판단과 책임 하에 등산 활동을 수행해야 합니다.
                </li>
                <li>
                  회사는 회원이 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.
                </li>
                <li>
                  회사는 회원 간 또는 회원과 제3자 상호간에 서비스를 매개로 하여 거래 등을 한 경우에는 책임이 면제됩니다.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제10조 (광고게재)</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>
                  회사는 서비스의 운영과 관련하여 서비스 화면, 이메일 등에 광고를 게재할 수 있습니다.
                </li>
                <li>
                  회사는 Google AdSense 등 제3자 광고 서비스를 통해 광고를 게재할 수 있으며,
                  이러한 광고주의 판촉활동에 회원이 참여하거나 교신 또는 거래를 함으로써 발생하는
                  손실과 손해에 대해 회사는 책임을 지지 않습니다.
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">제11조 (준거법 및 재판관할)</h2>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>본 약관은 대한민국 법률에 따라 규율되고 해석됩니다.</li>
                <li>
                  서비스 이용과 관련하여 회사와 회원 간에 분쟁이 발생한 경우, 양 당사자는 분쟁의 해결을 위해 성실히 협의합니다.
                </li>
                <li>
                  협의가 이루어지지 않을 경우, 소송은 민사소송법상의 관할법원에 제기합니다.
                </li>
              </ol>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
              <p className="text-gray-700">
                <strong>부칙:</strong> 본 약관은 {new Date().toLocaleDateString('ko-KR')}부터 시행됩니다.
              </p>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mt-6">
              <p className="text-gray-700">
                <strong>문의사항:</strong> 이용약관에 대한 문의사항이 있으시면
                <a href="/feedback" className="text-blue-600 hover:underline ml-1">문의하기</a> 페이지를 통해 연락주시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
