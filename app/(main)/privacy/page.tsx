import { Header } from '@/components/layout/Header';

export const metadata = {
  title: '개인정보 보호정책 | 하이킹메이트',
  description: '하이킹메이트의 개인정보 보호정책을 확인하세요.',
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header title="개인정보 보호정책" />

      <main className="max-w-screen-lg mx-auto p-6 pb-24">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">개인정보 보호정책</h1>

          <div className="prose prose-slate max-w-none">
            <p className="text-sm text-gray-600 mb-8">
              최종 수정일: {new Date().toLocaleDateString('ko-KR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 개인정보의 수집 및 이용 목적</h2>
              <p className="text-gray-700 mb-4">
                하이킹메이트는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는
                다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는
                「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공</li>
                <li>서비스 제공: 등산로 정보 제공, GPS 산행 기록, 커뮤니티 서비스</li>
                <li>마케팅 및 광고: 신규 서비스 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 수집하는 개인정보 항목</h2>
              <p className="text-gray-700 mb-4">하이킹메이트는 다음의 개인정보 항목을 처리하고 있습니다:</p>

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">필수 항목:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>이메일 주소</li>
                  <li>비밀번호 (암호화 저장)</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">선택 항목:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>닉네임</li>
                  <li>프로필 사진</li>
                  <li>GPS 위치 정보 (산행 기록 시)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">자동 수집 항목:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>IP 주소, 쿠키, 서비스 이용 기록</li>
                  <li>접속 로그, 기기 정보</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="text-gray-700 mb-4">
                이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>회원 정보:</strong> 회원 탈퇴 시까지 (단, 관계 법령에 따라 보존 필요시 해당 기간 동안 보관)</li>
                <li><strong>부정이용 기록:</strong> 5년</li>
                <li><strong>서비스 이용 기록:</strong> 3개월</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 개인정보의 제3자 제공</h2>
              <p className="text-gray-700">
                하이킹메이트는 이용자의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만
                처리하며, 이용자의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에
                해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 개인정보처리의 위탁</h2>
              <p className="text-gray-700 mb-4">
                하이킹메이트는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Supabase:</strong> 데이터베이스 관리, 인증 서비스</li>
                <li><strong>Vercel:</strong> 웹 호스팅 및 배포</li>
                <li><strong>Kakao/Naver:</strong> 소셜 로그인 서비스</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 이용자의 권리와 의무</h2>
              <p className="text-gray-700 mb-4">
                이용자는 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
                <li>회원 탈퇴 (개인정보 삭제)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 개인정보 보호책임자</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  하이킹메이트는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
                  정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <ul className="text-gray-700 space-y-1 mt-4">
                  <li><strong>이름:</strong> 하이킹메이트 운영팀</li>
                  <li><strong>연락처:</strong> /feedback 페이지를 통해 문의</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 쿠키의 운용</h2>
              <p className="text-gray-700 mb-4">
                하이킹메이트는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고
                수시로 불러오는 '쿠키(cookie)'를 사용합니다.
              </p>
              <p className="text-gray-700">
                쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에게 보내는 소량의 정보이며,
                이용자의 컴퓨터 하드디스크에 저장됩니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. 개인정보 보호정책의 변경</h2>
              <p className="text-gray-700">
                이 개인정보 보호정책은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는
                변경되는 개인정보 보호정책을 시행하기 최소 7일 전에 하이킹메이트 홈페이지를 통해 변경이유 및 내용 등을 공지하도록 하겠습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. 광고 및 제휴</h2>
              <p className="text-gray-700 mb-4">
                하이킹메이트는 Google AdSense 등 제3자 광고 서비스를 통해 광고를 게재할 수 있습니다.
                이러한 광고 서비스는 쿠키 및 웹 비콘을 사용하여 사용자의 관심사에 맞는 광고를 제공할 수 있습니다.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Google AdSense는 사용자의 관심사 기반 광고를 표시하기 위해 쿠키를 사용합니다</li>
                <li>사용자는 Google 광고 설정 페이지에서 맞춤 광고를 선택 해제할 수 있습니다</li>
              </ul>
            </section>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mt-8">
              <p className="text-gray-700">
                <strong>문의사항:</strong> 개인정보 보호정책에 대한 문의사항이 있으시면
                <a href="/feedback" className="text-blue-600 hover:underline ml-1">문의하기</a> 페이지를 통해 연락주시기 바랍니다.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
