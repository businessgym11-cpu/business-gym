import Link from "next/link";
import {
  Clapperboard,
  ImageIcon,
  TrendingUp,
  Wand2,
  Upload,
  Film,
  Download,
  Search,
  Users,
  Bookmark,
  AlertTriangle,
  ArrowRight,
  Play,
} from "lucide-react";

const features = [
  {
    href: "#shorts",
    icon: Clapperboard,
    title: "AI 숏츠 만들기",
    desc: "키워드 하나만 입력하면 대본부터 완성 영상까지 AI가 순서대로 만들어드려요. 가장 강력한 기능이에요.",
  },
  {
    href: "#images-tool",
    icon: ImageIcon,
    title: "AI 이미지 생성기",
    desc: "대본 없이, 문장 하나로 이미지를 만들고 그 이미지를 짧은 영상으로 바꿔볼 수 있어요.",
  },
  {
    href: "#trend",
    icon: TrendingUp,
    title: "트렌드 분석",
    desc: "뭘 만들지 모르겠을 때, 요즘 뜨는 영상과 내 채널 상태를 AI가 진단해줘요.",
  },
  {
    href: "#research",
    icon: Users,
    title: "채널 리서치",
    desc: "채널을 등록해 추적하거나, 키워드로 영상·채널을 찾아보고 마음에 드는 건 저장해두세요.",
  },
];

function ChapterHead({
  icon: Icon,
  tag,
  title,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-md shadow-purple-500/20">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <span className="inline-block rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-400">
          {tag}
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 max-w-xl text-sm text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

function StepCard({
  num,
  title,
  children,
  optional,
}: {
  num?: number;
  title: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        {num !== undefined && (
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-3xl font-extrabold text-transparent">
            {num}
          </span>
        )}
        {optional && (
          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
            선택 사항
          </span>
        )}
      </div>
      <h3 className="mt-2 text-lg font-bold text-slate-900">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function MockBar({
  placeholder,
  buttonLabel,
  buttonIcon: BtnIcon = Wand2,
}: {
  placeholder: string;
  buttonLabel: string;
  buttonIcon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mt-3 flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
      <div className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-slate-400">
        {placeholder}
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 px-3 py-2 text-xs font-bold text-white">
        <BtnIcon className="h-3.5 w-3.5" />
        {buttonLabel}
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
          처음 오셨다면 여기부터
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Business Gym 이용 가이드
        </h1>
        <p className="mt-3 text-slate-500">
          이 페이지 하나만 따라오시면, 첫 영상을 완성하는 데 걸리는 시간은 딱
          10분이에요.
        </p>
      </div>

      {/* 한눈에 보기 */}
      <div id="overview" className="mt-10 grid grid-cols-1 gap-4 scroll-mt-20 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <a
            key={f.href}
            href={f.href}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 text-white">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900">{f.title}</h3>
            <p className="flex-1 text-xs leading-relaxed text-slate-500">
              {f.desc}
            </p>
            <span className="flex items-center gap-1 text-xs font-bold text-purple-600">
              보러 가기 <ArrowRight className="h-3 w-3" />
            </span>
          </a>
        ))}
      </div>

      {/* ===== 숏츠 만들기 ===== */}
      <section id="shorts" className="mt-16 scroll-mt-20">
        <ChapterHead
          icon={Clapperboard}
          tag="기능 1 · AI 숏츠 만들기"
          title="3단계면 완성 영상이 나와요"
          sub="대본 기획 → 스토리보드 확정 → 최종 렌더링. 화면 위쪽에 지금 몇 번째 단계인지 항상 표시돼요."
        />

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StepCard num={1} title="대본 기획">
            <p>
              만들고 싶은 영상 주제를 한 문장으로 적고{" "}
              <b className="text-slate-800">[AI 대본 생성]</b>을 눌러요.
            </p>
            <p>영상 길이에 맞춰 대본을 자동으로 써줘요. 마음에 안 드는 부분은 직접 고쳐도 돼요.</p>
            <MockBar
              placeholder="예: 여름철 원룸 에어컨 관리 꿀팁"
              buttonLabel="AI 대본 생성"
            />
          </StepCard>

          <StepCard num={2} title="스토리보드 확정">
            <p>
              대본이 장면(씬)별로 자동으로 나뉘고, 각 장면에 어울리는 이미지를
              AI가 만들어줘요.
            </p>
            <p>
              이미지가 마음에 안 들면 문장을 고쳐서 다시 만들거나, 직접
              사진을 올려도 돼요.
            </p>
            <Callout>
              렌더링을 시작하면 <b>이후 수정이 안 돼요.</b> 이미지를 한 번 더
              확인하고 눌러주세요.
            </Callout>
          </StepCard>

          <StepCard num={3} title="최종 렌더링">
            <p>
              AI가 목소리와 자연스러운 움직임까지 더해서 영상을 완성해요.
              보통 몇 분 정도 걸려요.
            </p>
            <p>
              완성되면 바로 재생해서 확인하고,{" "}
              <b className="text-slate-800">[다운로드]</b>를 눌러 저장하세요.
            </p>
            <div className="mt-3 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-purple-50 text-slate-300">
              <Play className="h-8 w-8" />
            </div>
          </StepCard>

          <StepCard title="내 캐릭터 등록하기" optional>
            <p>
              같은 캐릭터가 계속 등장하는 영상을 원한다면 등록해두세요. 정면
              사진 1장만 있으면 충분해요.
            </p>
            <p>
              전면·측면·후면이 한 장에 모여있는 사진이 있다면{" "}
              <b className="text-slate-800">[한 장으로 업로드]</b>를
              눌러보세요. AI가 알아서 나눠서 인식해요.
            </p>
          </StepCard>
        </div>
      </section>

      {/* ===== 이미지 생성기 ===== */}
      <section id="images-tool" className="mt-16 scroll-mt-20">
        <ChapterHead
          icon={ImageIcon}
          tag="기능 2 · AI 이미지 생성기"
          title="짧은 클립 하나만 빠르게 필요할 때"
          sub="대본 짤 필요 없이, 문장 하나 → 이미지 → 영상까지 뚝딱 만드는 간단 버전이에요."
        />

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StepCard num={1} title="문장으로 이미지 만들기">
            <p>
              원하는 장면을 문장으로 적고 <b className="text-slate-800">[생성하기]</b>를 누르면
              Business Gym 시그니처 스타일로 이미지가 나와요.
            </p>
            <p>여기서도 캐릭터를 등록해두면 같은 얼굴로 이미지가 만들어져요.</p>
            <MockBar
              placeholder="예: 따뜻한 조명 아래 책 읽는 모습"
              buttonLabel="생성하기"
            />
          </StepCard>

          <StepCard num={2} title="이미지를 영상으로 바꾸기">
            <p>
              이미지 카드의 <b className="text-slate-800">[영상으로 만들기]</b>를 누르고
              어떤 움직임을 넣을지 적은 뒤, 길이(3·5·8·10초)를 골라요.
            </p>
            <p>
              내 컴퓨터 사진을 올려서 바로 영상으로 만들 수도 있어요. (상단
              [내 이미지로 영상 만들기])
            </p>
            <MockBar
              placeholder="예: 살짝 미소 지으며 고개를 끄덕인다"
              buttonLabel="영상 생성하기"
              buttonIcon={Film}
            />
          </StepCard>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">완성된 영상 확인하기</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            창을 닫아도 영상 생성은 계속 진행돼요. 완성된 영상은 화면 위쪽{" "}
            <b className="text-slate-800">&quot;내가 만든 영상&quot;</b> 목록에서 다시 볼 수
            있어요.
          </p>
          <Callout>
            <b>로그아웃하면 이 목록이 사라져요.</b> 마음에 드는 영상은 꼭
            다운로드해두세요.
          </Callout>
        </div>
      </section>

      {/* ===== 트렌드 분석 ===== */}
      <section id="trend" className="mt-16 scroll-mt-20">
        <ChapterHead
          icon={TrendingUp}
          tag="기능 3 · 트렌드 분석"
          title="뭘 만들지 모르겠다면 여기서 시작"
          sub="검색 → 구조 분석 → 바로 대본 만들기까지 이어져요."
        />

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <StepCard num={1} title="키워드로 인기 영상 찾기">
            <p>
              궁금한 주제를 검색하면 그 주제로 실제 잘 되고 있는 영상들을
              찾아줘요.
            </p>
            <p>
              또는 <b className="text-slate-800">[지난주 급상승 TOP10]</b>이나{" "}
              <b className="text-slate-800">[내 채널 분석]</b> 카드를 눌러도
              돼요.
            </p>
            <MockBar
              placeholder="예: 요리, 헬스, 육아"
              buttonLabel=""
              buttonIcon={Search}
            />
          </StepCard>

          <StepCard num={2} title="영상 구조 분석하기">
            <p>
              마음에 드는 영상 카드에서{" "}
              <b className="text-slate-800">[구조 분석하기]</b>를 누르면 AI가
              훅 포인트·구성·참고할 점을 설명해줘요.
            </p>
            <p>
              분석 후 나오는{" "}
              <b className="text-slate-800">[이 구조로 대본 만들기]</b>를
              누르면 그 내용을 그대로 들고 숏츠 만들기 1단계로 넘어가요.
            </p>
          </StepCard>

          <StepCard num={3} title="내 채널 진단받기">
            <p>
              유튜브 채널 주소나 @핸들만 입력하면, 구독자·조회수·업로드 주기
              데이터를 바탕으로 AI가 조회수·매출을 올릴 구체적인 팁을
              알려줘요.
            </p>
            <p className="text-slate-500">로그인 없이도 사용할 수 있어요.</p>
            <MockBar
              placeholder="예: youtube.com/@채널명 또는 @핸들"
              buttonLabel="분석하기"
              buttonIcon={Search}
            />
          </StepCard>
        </div>
      </section>

      {/* ===== 채널 리서치 ===== */}
      <section id="research" className="mt-16 scroll-mt-20">
        <ChapterHead
          icon={Users}
          tag="기능 4 · 채널 리서치"
          title="찾고, 분석하고, 저장까지 한 곳에서"
          sub="탭 3개(채널 분석·영상 찾기·채널 찾기)로 나뉘어 있어요. 관심 채널을 추적하거나, 키워드로 영상·채널을 발굴해보세요."
        />

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StepCard num={1} title="채널 등록해서 추적하기">
            <p>
              채널 URL이나 @핸들을 넣고{" "}
              <b className="text-slate-800">[채널 등록]</b>을 누르면, 최근
              영상 최대 50개를 조회수 순으로 보여줘요.
            </p>
            <p>
              영상마다 <b className="text-slate-800">주목도</b>(평균 대비
              얼마나 튀었는지), <b className="text-slate-800">효율도</b>
              (구독자 대비 얼마나 효율적으로 퍼졌는지) 등급이 같이 나와요.
            </p>
            <MockBar
              placeholder="예: youtube.com/@채널명 또는 @핸들"
              buttonLabel="채널 등록"
              buttonIcon={Search}
            />
          </StepCard>

          <StepCard num={2} title="키워드로 영상 찾기">
            <p>
              등록한 채널이 아니어도, 궁금한 주제를 검색하면 유튜브 전체에서
              영상을 찾아줘요.
            </p>
            <p>
              조회수·구독자·좋아요 범위, 게시일, Shorts/롱폼, Creative
              Commons까지 <b className="text-slate-800">필터</b>로 상세하게
              걸러볼 수 있어요.
            </p>
          </StepCard>

          <StepCard num={3} title="주제어로 채널 발굴하기">
            <p>
              주제어를 입력하면 관련 채널들을 찾아줘요 — 구독자 대비 조회수
              전환이 좋은 채널을 골라볼 수 있어요.
            </p>
            <p>
              마음에 드는 채널에서 <b className="text-slate-800">[등록]</b>을
              누르면 바로 채널 분석 탭으로 넘어가서 추적을 시작해요.
            </p>
          </StepCard>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              영상을 클릭하면 더 자세히 보여요
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              표나 카드에서 영상을 클릭하면{" "}
              <b className="text-slate-800">영상 정보 · 채널 정보 · 인기 영상</b>{" "}
              3개 탭으로 된 상세 패널이 열려요. 조회수가 채널 평균보다 얼마나
              높은지 실제 %로도 보여줘요.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
              <Bookmark className="h-4 w-4 text-purple-600" />
              마음에 드는 영상은 저장해두세요
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              북마크 아이콘을 누르면 저장돼요. 우측 상단{" "}
              <b className="text-slate-800">[수집한 영상]</b>에서 폴더를
              만들어 정리해두고 나중에 다시 볼 수 있어요.
            </p>
          </div>
        </div>

        <Callout>
          주목도·효율도 같은 등급은 정확한 값이 아니라{" "}
          <b>평균 대비 상대적인 근사치</b>예요. 같은 채널이나 검색 결과 안에서
          비교하는 참고용으로만 활용해주세요.
        </Callout>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="mt-16 scroll-mt-20">
        <span className="inline-block rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-400">
          마지막으로
        </span>
        <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
          자주 묻는 질문
        </h2>

        <div className="mt-5 space-y-3">
          <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" open>
            <summary className="cursor-pointer list-none font-bold text-slate-800">
              로그인이 안 돼요. 계정이 없어요.
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Business Gym은 승인제로 운영돼요. 먼저 회원가입 신청을 하면,
              담당자가 확인한 뒤 이메일로 로그인 정보를 보내드려요. 승인
              전까지는 대기 화면이 표시되는 게 정상이에요.
            </p>
          </details>

          <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer list-none font-bold text-slate-800">
              렌더링 중에 화면을 닫으면 어떻게 되나요?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              이미지 → 영상 변환은 창을 닫아도 계속 진행돼요. 완성되면
              &quot;내가 만든 영상&quot; 목록에서 다시 확인할 수 있어요.
              다만 로그아웃하면 그 목록은 사라지니, 완성된 영상은 꼭 미리
              다운로드해두세요.
            </p>
          </details>

          <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer list-none font-bold text-slate-800">
              캐릭터는 꼭 등록해야 하나요?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              아니요, 선택 사항이에요. 등록하지 않으면 매 장면마다 AI가 다른
              인물로 이미지를 만들어요. 같은 얼굴이 반복해서 나오는 영상을
              원한다면 등록을 추천해요.
            </p>
          </details>

          <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer list-none font-bold text-slate-800">
              스토리보드 단계에서 이미지를 다시 만들 수 있나요?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              네, 최종 렌더링을 시작하기 전까지는 문장을 고쳐서 이미지를
              얼마든지 다시 만들거나 직접 업로드할 수 있어요. 단, 렌더링을
              한 번 시작하면 그 스토리보드는 더 이상 수정할 수 없어요.
            </p>
          </details>

          <details className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <summary className="cursor-pointer list-none font-bold text-slate-800">
              채널 리서치의 주목도·효율도는 정확한 수치인가요?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              아니요. 유튜브가 공식적으로 제공하는 지표가 아니라, 저희가
              평균 조회수·구독자 수 대비로 계산한 근사 등급이에요. 같은
              채널이나 검색 결과 안에서 상대적으로 비교하는 참고용으로
              봐주세요.
            </p>
          </details>
        </div>
      </section>

      <div className="mt-16 flex items-center justify-between border-t border-slate-100 pt-6 text-sm text-slate-400">
        <span>더 궁금한 점이 있다면 우측 상단 프로필 메뉴에서 문의해주세요.</span>
        <Link href="#overview" className="font-bold text-purple-600">
          맨 위로 ↑
        </Link>
      </div>
    </div>
  );
}
