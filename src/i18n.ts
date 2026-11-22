export type Language = 'zh-CN' | 'en' | 'zh-TW' | 'ja' | 'ko'

export const languages: { code: Language; label: string }[] = [
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]

const translations: Record<string, [string, string, string, string]> = {
  照相: ['Photo', '照相', '写真', '사진'],
  馆: [' Studio', '館', '館', '관'],
  照相馆: ['Photo Studio', '照相館', '写真館', '사진관'],
  证件照工坊: ['ID Photo Studio', '證件照工坊', '証明写真スタジオ', '증명사진 스튜디오'],
  证件照工坊首页: ['ID Photo Studio home', '證件照工坊首頁', '証明写真スタジオのホーム', '증명사진 스튜디오 홈'],
  '图片仅在本地处理，不会上传': ['Photos are processed locally and never uploaded', '照片僅在本機處理，不會上傳', '写真は端末内で処理され、アップロードされません', '사진은 기기에서 처리되며 업로드되지 않습니다'],
  选择语言: ['Select language', '選擇語言', '言語を選択', '언어 선택'],
  '打开照片': ['Open photo', '開啟照片', '写真を開く', '사진 열기'],
  '证件照制作': ['ID PHOTO MAKER', '證件照製作', '証明写真の作成', '증명사진 만들기'],
  '把日常照片，变成': ['Turn an everyday photo into a ', '把日常照片，變成', 'いつもの写真を', '일상 사진을 '],
  专业证件照: ['professional ID photo', '專業證件照', 'プロ品質の証明写真に', '전문 증명사진으로'],
  '选照片、调尺寸、换底色，一张照片轻松搞定。': ['Choose a photo, set its size and change the background—in just a few clicks.', '選擇照片、調整尺寸、更換底色，輕鬆完成證件照。', '写真を選び、サイズや背景色を調整するだけで簡単に完成。', '사진 선택, 크기 조정, 배경색 변경까지 간편하게 완성하세요.'],
  编辑: ['Edit', '編輯', '編集', '편집'],
  排版: ['Layout', '排版', 'レイアウト', '배치'],
  下载: ['Export', '下載', '保存', '다운로드'],
  编辑工具: ['Editing tools', '編輯工具', '編集ツール', '편집 도구'],
  裁剪尺寸: ['Photo size', '裁切尺寸', '写真サイズ', '사진 크기'],
  照片调整: ['Adjust photo', '照片調整', '写真の調整', '사진 조정'],
  相纸排版: ['Print layout', '相紙排版', '印刷レイアウト', '인쇄 배치'],
  等待添加照片: ['Add a photo to get started', '等待新增照片', '写真を追加してください', '사진을 추가하세요'],
  '在照片上拖动以擦除背景': ['Drag on the photo to erase the background', '在照片上拖曳以擦除背景', '写真上をドラッグして背景を消去', '사진을 드래그하여 배경 지우기'],
  点击照片背景取色: ['Click the photo background to sample its color', '點擊照片背景取色', '写真の背景をクリックして色を取得', '사진 배경을 클릭해 색상 추출'],
  '拖动照片调整位置 · 滚轮缩放': ['Drag to reposition · Scroll to zoom', '拖曳照片調整位置 · 滾輪縮放', 'ドラッグで位置調整 · ホイールで拡大縮小', '드래그하여 위치 조정 · 휠로 확대/축소'],
  '在右侧调整照片与背景': ['Adjust the photo and background on the right', '在右側調整照片與背景', '右側で写真と背景を調整', '오른쪽에서 사진과 배경 조정'],
  画布缩放: ['Canvas zoom', '畫布縮放', 'キャンバスの拡大縮小', '캔버스 확대/축소'],
  缩小画布: ['Zoom out canvas', '縮小畫布', 'キャンバスを縮小', '캔버스 축소'],
  画布缩放比例: ['Canvas zoom level', '畫布縮放比例', 'キャンバスの倍率', '캔버스 확대 비율'],
  放大画布: ['Zoom in canvas', '放大畫布', 'キャンバスを拡大', '캔버스 확대'],
  从电脑中选择一张照片: ['Choose a photo from your device', '從裝置中選擇一張照片', '端末から写真を選択', '기기에서 사진 선택'],
  或将照片拖到这里: ['or drag and drop it here', '或將照片拖曳至此', 'またはここにドラッグ＆ドロップ', '또는 여기에 드래그 앤 드롭'],
  '支持 JPG、PNG、WebP': ['JPG, PNG and WebP supported', '支援 JPG、PNG、WebP', 'JPG、PNG、WebPに対応', 'JPG, PNG, WebP 지원'],
  取消: ['Cancel', '取消', 'キャンセル', '취소'],
  图片在你的设备中安全处理: ['Your photo is securely processed on your device', '照片會在您的裝置上安全處理', '写真は端末内で安全に処理されます', '사진은 기기에서 안전하게 처리됩니다'],
  裁剪预览: ['Crop preview', '裁切預覽', 'トリミングプレビュー', '자르기 미리보기'],
  当前裁剪照片: ['Current cropped photo', '目前裁切的照片', '現在のトリミング写真', '현재 자른 사진'],
  选择证件照尺寸: ['Choose photo size', '選擇證件照尺寸', '写真サイズを選択', '사진 크기 선택'],
  '常用规格，精准裁切': ['Common sizes for precise cropping', '常用規格，精準裁切', 'よく使うサイズを正確にトリミング', '자주 쓰는 크기로 정확하게 자르기'],
  尺寸单位: ['Units', '尺寸單位', '単位', '단위'],
  '小一寸': ['Small 1-inch', '小一吋', '小型1インチ', '소형 1인치'],
  '标准一寸': ['Standard 1-inch', '標準一吋', '標準1インチ', '표준 1인치'],
  '大一寸': ['Large 1-inch', '大一吋', '大型1インチ', '대형 1인치'],
  '1.5寸': ['1.5-inch', '1.5吋', '1.5インチ', '1.5인치'],
  通用证件照规格: ['General ID photo size', '通用證件照規格', '一般的な証明写真サイズ', '일반 증명사진 규격'],
  '小二寸': ['Small 2-inch', '小二吋', '小型2インチ', '소형 2인치'],
  '标准二寸': ['Standard 2-inch', '標準二吋', '標準2インチ', '표준 2인치'],
  '某些学籍照、报名': ['Some school records and applications', '部分學籍照、報名用途', '一部の学籍写真・申請用', '일부 학적 사진 및 지원용'],
  '身份证、学生证、银行卡': ['ID cards, student IDs and bank cards', '身分證、學生證、銀行卡', '身分証、学生証、銀行カード', '신분증, 학생증, 은행 카드'],
  '港澳通行证、某些签证': ['Hong Kong/Macau permits and some visas', '港澳通行證、部分簽證', '香港・マカオ通行証、一部のビザ', '홍콩·마카오 통행증 및 일부 비자'],
  中国护照: ['Chinese passport', '中國護照', '中国のパスポート', '중국 여권'],
  '驾驶证、某些报名用': ['Driver licences and some applications', '駕照、部分報名用途', '運転免許証、一部の申請用', '운전면허증 및 일부 지원용'],
  自定义: ['Custom', '自訂', 'カスタム', '사용자 지정'],
  自定义证件照尺寸: ['Custom ID photo size', '自訂證件照尺寸', 'カスタム証明写真サイズ', '사용자 지정 증명사진 크기'],
  自定义尺寸: ['Custom size', '自訂尺寸', 'カスタムサイズ', '사용자 지정 크기'],
  宽度: ['Width', '寬度', '幅', '너비'],
  高度: ['Height', '高度', '高さ', '높이'],
  宽: ['Width', '寬', '幅', '너비'],
  高: ['Height', '高', '高さ', '높이'],
  裁剪区域: ['Crop area', '裁切區域', 'トリミング範囲', '자르기 영역'],
  较小: ['Smaller', '較小', '小さく', '작게'],
  较大: ['Larger', '較大', '大きく', '크게'],
  照片缩放: ['Photo zoom', '照片縮放', '写真の拡大縮小', '사진 확대/축소'],
  旋转微调: ['Fine rotation', '旋轉微調', '回転の微調整', '회전 미세 조정'],
  旋转角度: ['Rotation angle', '旋轉角度', '回転角度', '회전 각도'],
  归零: ['Reset', '歸零', 'リセット', '초기화'],
  '拖动照片调整构图；旋转时显示网格辅助对齐。': ['Drag the photo to compose. A grid helps with alignment when rotating.', '拖曳照片調整構圖；旋轉時會顯示網格輔助對齊。', '写真をドラッグして構図を調整。回転時はグリッドで位置を合わせられます。', '사진을 드래그해 구도를 조정하세요. 회전 시 격자가 정렬을 돕습니다.'],
  照片精细调整: ['Photo adjustments', '照片微調', '写真の詳細調整', '사진 세부 조정'],
  '自然肤色，清晰呈现': ['Natural skin tones, crisp results', '自然膚色，清晰呈現', '自然な肌色でくっきり仕上げ', '자연스러운 피부톤과 선명한 표현'],
  色相: ['Hue', '色相', '色相', '색조'],
  色温: ['Temperature', '色溫', '色温度', '색온도'],
  亮度: ['Brightness', '亮度', '明るさ', '밝기'],
  '色阶 / 对比度': ['Levels / Contrast', '色階 / 對比', 'レベル / コントラスト', '레벨 / 대비'],
  冷色: ['Cool', '冷色', '寒色', '차갑게'],
  暖色: ['Warm', '暖色', '暖色', '따뜻하게'],
  证件照底色: ['Background color', '證件照底色', '背景色', '배경색'],
  采样原背景后替换为标准底色: ['Sample the original background, then replace it with a standard color', '取樣原背景後替換為標準底色', '元の背景色を取得して標準色に置き換えます', '원본 배경을 추출한 후 표준 색상으로 변경하세요'],
  白色: ['White', '白色', '白', '흰색'],
  蓝色: ['Blue', '藍色', '青', '파란색'],
  红色: ['Red', '紅色', '赤', '빨간색'],
  浅蓝: ['Light blue', '淺藍', '水色', '하늘색'],
  白色背景: ['White background', '白色背景', '白い背景', '흰색 배경'],
  蓝色背景: ['Blue background', '藍色背景', '青い背景', '파란색 배경'],
  红色背景: ['Red background', '紅色背景', '赤い背景', '빨간색 배경'],
  浅蓝背景: ['Light blue background', '淺藍色背景', '水色の背景', '하늘색 배경'],
  '自定义背景颜色': ['Custom background color', '自訂背景顏色', 'カスタム背景色', '사용자 지정 배경색'],
  '请点击照片中的背景': ['Click the background in the photo', '請點擊照片中的背景', '写真の背景をクリックしてください', '사진의 배경을 클릭하세요'],
  重新采样背景颜色: ['Sample background again', '重新取樣背景顏色', '背景色を再取得', '배경색 다시 추출'],
  '点击照片，采样原背景': ['Click the photo to sample its original background', '點擊照片，取樣原背景', '写真をクリックして元の背景色を取得', '사진을 클릭해 원본 배경 추출'],
  背景识别宽容度: ['Background detection tolerance', '背景辨識容差', '背景検出の許容値', '배경 감지 허용 범위'],
  '仅替换与照片边缘连通的背景区域，并限制最大识别色差；调高可包含光照不均的背景。': ['Replaces background areas connected to the photo edges, up to the selected color difference. Increase it for uneven lighting.', '僅替換與照片邊緣連通的背景區域，並限制最大辨識色差；調高可包含光線不均的背景。', '写真の端につながる背景のみを色差の範囲内で置き換えます。照明ムラがある場合は値を上げてください。', '사진 가장자리와 연결된 배경만 색상 차이 범위 내에서 교체합니다. 조명이 고르지 않으면 값을 높이세요.'],
  结束手动擦除: ['Finish manual erasing', '結束手動擦除', '手動消去を終了', '수동 지우기 완료'],
  手动擦除背景: ['Erase background manually', '手動擦除背景', '背景を手動で消去', '배경 수동 지우기'],
  画笔大小: ['Brush size', '筆刷大小', 'ブラシサイズ', '브러시 크기'],
  '手动擦除画笔大小': ['Manual eraser brush size', '手動擦除筆刷大小', '手動消去ブラシのサイズ', '수동 지우개 브러시 크기'],
  '在照片上拖动，涂抹区域将替换为当前证件照底色。': ['Drag on the photo to paint over areas with the selected background color.', '在照片上拖曳，塗抹區域會替換為目前證件照底色。', '写真上をドラッグすると、塗った部分が選択中の背景色に置き換わります。', '사진을 드래그하면 칠한 영역이 선택한 배경색으로 바뀝니다.'],
  清除手动擦除: ['Clear manual erasing', '清除手動擦除', '手動消去をクリア', '수동 지우기 지우기'],
  恢复默认调整: ['Reset adjustments', '還原預設調整', '調整を初期状態に戻す', '조정 기본값 복원'],
  相纸自动排版: ['Automatic print layout', '相紙自動排版', '印刷レイアウト', '인쇄용 자동 배치'],
  '打印前预览，一张多用': ['Preview before printing and print multiple copies', '列印前預覽，一張多用', '印刷前にプレビュー、1枚に複数配置', '인쇄 전 미리보기, 한 장에 여러 장 배치'],
  选择相纸规格: ['Choose paper size', '選擇相紙規格', '用紙サイズを選択', '용지 크기 선택'],
  '5 寸相纸': ['5-inch photo paper', '5 吋相紙', '5インチ写真用紙', '5인치 인화지'],
  '6 寸相纸': ['6-inch photo paper', '6 吋相紙', '6インチ写真用紙', '6인치 인화지'],
  '7 寸相纸': ['7-inch photo paper', '7 吋相紙', '7インチ写真用紙', '7인치 인화지'],
  'A4 纸': ['A4 paper', 'A4 紙', 'A4用紙', 'A4 용지'],
  自设纸张尺寸: ['Custom paper size', '自訂紙張尺寸', '用紙サイズを指定', '사용자 지정 용지 크기'],
  相纸方向: ['Paper orientation', '相紙方向', '用紙の向き', '용지 방향'],
  横向: ['Landscape', '橫向', '横向き', '가로'],
  纵向: ['Portrait', '直向', '縦向き', '세로'],
  预览: [' preview', '預覽', ' プレビュー', ' 미리보기'],
  自动排列: ['Auto layout', '自動排列', '自動配置', '자동 배치'],
  照片间距: ['Photo spacing', '照片間距', '写真間の間隔', '사진 간격'],
  整体居中: ['Centered', '整體置中', '中央揃え', '가운데 정렬'],
  '像素按 300 DPI 计算，冲印时请使用“实际尺寸”。': ['Pixels are calculated at 300 DPI. Select “Actual size” when printing.', '像素以 300 DPI 計算，沖印時請選擇「實際尺寸」。', 'ピクセル数は300 DPIで計算されます。印刷時は「実際のサイズ」を選択してください。', '픽셀은 300 DPI 기준입니다. 인쇄 시 “실제 크기”를 선택하세요.'],
  撤销上一步: ['Undo last action', '復原上一步', '元に戻す', '실행 취소'],
  撤销: ['Undo', '復原', '元に戻す', '실행 취소'],
  导出格式: ['Export format', '匯出格式', '書き出し形式', '내보내기 형식'],
  '图片导出格式': ['Image export format', '圖片匯出格式', '画像の書き出し形式', '이미지 내보내기 형식'],
  '高清 · 按 300 DPI 计算': ['High resolution · 300 DPI', '高解析度 · 以 300 DPI 計算', '高解像度 · 300 DPI', '고해상도 · 300 DPI'],
  下载证件照: ['Download ID photo', '下載證件照', '証明写真を保存', '증명사진 다운로드'],
  确定裁剪: ['Confirm crop', '確認裁切', 'トリミングを確定', '자르기 완료'],
  下载排版照片: ['Download print layout', '下載排版照片', 'レイアウトを保存', '배치 이미지 다운로드'],
  关闭提示: ['Dismiss message', '關閉提示', 'メッセージを閉じる', '알림 닫기'],
  裁剪框大小: ['Crop frame size', '裁切框大小', 'トリミング枠のサイズ', '자르기 프레임 크기'],
  '本地处理，照片不上传': ['Processed locally, never uploaded', '本機處理，照片不會上傳', '端末内で処理、アップロードなし', '기기에서 처리, 업로드 없음'],
  支持常用图片格式: ['Common image formats supported', '支援常用圖片格式', '一般的な画像形式に対応', '일반 이미지 형식 지원'],
  '按 300 DPI 计算像素尺寸': ['Pixel dimensions calculated at 300 DPI', '以 300 DPI 計算像素尺寸', 'ピクセルサイズは300 DPIで計算', '픽셀 크기는 300 DPI 기준'],
  '让每一张证件照都刚刚好': ['The right fit for every ID photo', '讓每張證件照都恰到好處', '一枚一枚、ちょうどいい証明写真に', '모든 증명사진을 딱 맞게'],
  '照相馆 · 证件照工坊': ['Photo Studio · ID Photo Maker', '照相館 · 證件照工坊', '写真館 · 証明写真スタジオ', '사진관 · 증명사진 스튜디오'],
  '在浏览器中制作证件照：裁剪尺寸、调整色彩、替换底色、相纸排版并高清导出。': ['Make ID photos in your browser: crop, adjust colors, replace backgrounds, arrange for printing and export in high resolution.', '在瀏覽器中製作證件照：裁切尺寸、調整色彩、更換底色、相紙排版並以高解析度匯出。', 'ブラウザーで証明写真を作成：サイズ調整、色補正、背景色の変更、印刷レイアウト、高解像度での保存。', '브라우저에서 증명사진 만들기: 자르기, 색상 조정, 배경 교체, 인쇄 배치 및 고해상도 내보내기.'],
  免费使用: ['Free to use', '免費使用', '無料で利用', '무료 사용'],
  无需注册: ['No sign-up required', '無需註冊', '登録不要', '가입 불필요'],
  '图片无法读取，请选择其他图片格式重试。': ['Unable to read the image. Try another image format.', '無法讀取圖片，請選擇其他圖片格式再試一次。', '画像を読み込めません。別の形式の画像をお試しください。', '이미지를 읽을 수 없습니다. 다른 형식의 이미지를 선택해 다시 시도하세요.'],
  '请选择 JPG、PNG 或 WebP 图片文件。': ['Choose a JPG, PNG or WebP image.', '請選擇 JPG、PNG 或 WebP 圖片檔案。', 'JPG、PNG、WebP形式の画像を選択してください。', 'JPG, PNG 또는 WebP 이미지 파일을 선택하세요.'],
  '浏览器无法读取图片像素，背景取色暂不可用。': ['The browser cannot read image pixels, so background sampling is unavailable.', '瀏覽器無法讀取圖片像素，目前無法取樣背景顏色。', 'ブラウザーが画像のピクセルを読み取れないため、背景色を取得できません。', '브라우저가 이미지 픽셀을 읽을 수 없어 배경색을 추출할 수 없습니다.'],
  '背景颜色已采样，可在右侧选择替换底色。': ['Background sampled. Choose a replacement color on the right.', '已取樣背景顏色，請在右側選擇替換底色。', '背景色を取得しました。右側で置き換える色を選択してください。', '배경색을 추출했습니다. 오른쪽에서 바꿀 색상을 선택하세요.'],
  '请先打开一张图片。': ['Open a photo first.', '請先開啟一張照片。', '先に写真を開いてください。', '먼저 사진을 여세요.'],
  '浏览器无法创建图像画布。': ['The browser could not create an image canvas.', '瀏覽器無法建立圖片畫布。', 'ブラウザーで画像キャンバスを作成できませんでした。', '브라우저에서 이미지 캔버스를 만들 수 없습니다.'],
  '浏览器无法创建排版画布。': ['The browser could not create the print layout canvas.', '瀏覽器無法建立排版畫布。', 'ブラウザーで印刷レイアウトのキャンバスを作成できませんでした。', '브라우저에서 인쇄 배치 캔버스를 만들 수 없습니다.'],
  '图片导出失败，请尝试 PNG 格式。': ['Image export failed. Try the PNG format.', '圖片匯出失敗，請嘗試 PNG 格式。', '画像を書き出せませんでした。PNG形式をお試しください。', '이미지 내보내기에 실패했습니다. PNG 형식을 사용해 보세요.'],
  '裁剪失败，请重试。': ['Cropping failed. Please try again.', '裁切失敗，請再試一次。', 'トリミングに失敗しました。もう一度お試しください。', '자르기에 실패했습니다. 다시 시도하세요.'],
  '导出失败，请重试。': ['Export failed. Please try again.', '匯出失敗，請再試一次。', '書き出しに失敗しました。もう一度お試しください。', '내보내기에 실패했습니다. 다시 시도하세요.'],
  '排版导出失败，请重试。': ['Print layout export failed. Please try again.', '排版匯出失敗，請再試一次。', 'レイアウトの書き出しに失敗しました。もう一度お試しください。', '배치 이미지 내보내기에 실패했습니다. 다시 시도하세요.'],
  '请先在“裁剪尺寸”中点击“确定裁剪”，再进行照片调整或相纸排版。': ['Confirm the crop in “Photo size” before adjusting the photo or creating a print layout.', '請先在「裁切尺寸」中點選「確認裁切」，再調整照片或進行相紙排版。', '写真の調整や印刷レイアウトの前に、「写真サイズ」でトリミングを確定してください。', '사진 조정이나 인쇄 배치 전에 “사진 크기”에서 자르기를 완료하세요.'],
  '证件照': ['ID photo', '證件照', '証明写真', '증명사진'],
  '自定义相纸': ['Custom paper', '自訂相紙', 'カスタム用紙', '사용자 지정 용지'],
}

const localeIndex: Record<Exclude<Language, 'zh-CN'>, number> = {
  en: 0,
  'zh-TW': 1,
  ja: 2,
  ko: 3,
}

const dynamicTranslation = (language: Language, text: string) => {
  const cropMatch = text.match(/^裁剪完成，当前照片为 (\d+) × (\d+)px。$/)
  if (cropMatch) {
    const [, width, height] = cropMatch
    const messages = {
      en: `Crop complete. Photo size: ${width} × ${height}px.`,
      'zh-TW': `裁切完成，目前照片尺寸為 ${width} × ${height}px。`,
      ja: `トリミング完了。写真サイズ: ${width} × ${height}px。`,
      ko: `자르기 완료. 사진 크기: ${width} × ${height}px.`,
    }
    return messages[language as Exclude<Language, 'zh-CN'>]
  }
  const exportMatch = text.match(/^已导出 (.+)（(\d+) × (\d+)px）。$/)
  if (exportMatch) {
    const [, name, width, height] = exportMatch
    const translatedName = translate(language, name)
    const messages = {
      en: `Exported ${translatedName} (${width} × ${height}px).`,
      'zh-TW': `已匯出 ${translatedName}（${width} × ${height}px）。`,
      ja: `${translatedName}を保存しました（${width} × ${height}px）。`,
      ko: `${translatedName} 내보내기 완료 (${width} × ${height}px).`,
    }
    return messages[language as Exclude<Language, 'zh-CN'>]
  }
  const layoutMatch = text.match(/^已导出(.+)(横向|纵向)排版，共 (\d+) 张。$/)
  if (layoutMatch) {
    const [, name, orientation, count] = layoutMatch
    const translatedName = translate(language, name)
    const translatedOrientation = translate(language, orientation)
    const messages = {
      en: `Exported ${translatedName} ${translatedOrientation.toLowerCase()} layout with ${count} photos.`,
      'zh-TW': `已匯出${translatedName}${translatedOrientation}排版，共 ${count} 張。`,
      ja: `${translatedName}の${translatedOrientation}レイアウトを保存しました（${count}枚）。`,
      ko: `${translatedName} ${translatedOrientation} 배치를 내보냈습니다 (${count}장).`,
    }
    return messages[language as Exclude<Language, 'zh-CN'>]
  }
  const countMatch = text.match(/^(\d+) 列 × (\d+) 行 · 共 (\d+) 张$/)
  if (countMatch) {
    const [, columns, rows, count] = countMatch
    const messages = {
      en: `${columns} columns × ${rows} rows · ${count} photos total`,
      'zh-TW': `${columns} 欄 × ${rows} 列 · 共 ${count} 張`,
      ja: `${columns}列 × ${rows}行 · 合計${count}枚`,
      ko: `${columns}열 × ${rows}행 · 총 ${count}장`,
    }
    return messages[language as Exclude<Language, 'zh-CN'>]
  }
  return undefined
}

export function translate(language: Language, text: string): string {
  if (language === 'zh-CN') return text
  const trimmed = text.trim()
  if (!trimmed) return text
  const translated = dynamicTranslation(language, trimmed)
    ?? translations[trimmed]?.[localeIndex[language]]
    ?? trimmed
  const leading = text.match(/^\s*/)?.[0] ?? ''
  const trailing = text.match(/\s*$/)?.[0] ?? ''
  return `${leading}${translated}${trailing}`
}

