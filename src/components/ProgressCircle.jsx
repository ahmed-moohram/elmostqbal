'use client';

import { useEffect, useRef } from 'react';

const ProgressCircle = ({ value }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 15;
    
    // تنظيف الكانفاس
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم حلقة خارجية مضيئة
    const glowRadius = radius + 8;
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, radius, 
      centerX, centerY, glowRadius
    );
    glowGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    glowGradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // رسم الدائرة الخلفية بتأثير ظلال داخلية
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#e5e7eb';
    
    // تأثير الظلال الداخلية
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.stroke();
    
    // إعادة ضبط الظلال
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // رسم دائرة التقدم مع تدرج لوني محسّن
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#6d28d9');  // primary
    gradient.addColorStop(0.5, '#8b5cf6');  // accent
    gradient.addColorStop(1, '#a78bfa');  // accent lighter
    
    const startAngle = -0.5 * Math.PI; // تبدأ من الأعلى
    const endAngle = startAngle + (2 * Math.PI * value / 100);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.lineWidth = 12;
    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    
    // إضافة تأثير توهج للمسار
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(109, 40, 217, 0.5)';
    ctx.stroke();
    
    // إعادة ضبط الظلال
    ctx.shadowBlur = 0;
    
    // رسم دائرة داخلية بتدرج شفاف
    const innerRadius = radius - 25;
    const innerGradient = ctx.createRadialGradient(
      centerX, centerY, innerRadius * 0.5, 
      centerX, centerY, innerRadius
    );
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    // كتابة النسبة المئوية مع ظل
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#6d28d9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // إضافة ظل للنص
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(109, 40, 217, 0.3)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    
    // تنسيق النص للتأكد من أنه عدد صحيح
    const formattedValue = Math.round(value);
    ctx.fillText(`${formattedValue}%`, centerX, centerY - 10);
    
    // إعادة ضبط الظلال
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // إضافة نص صغير تحت النسبة المئوية
    ctx.font = '12px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('إنجاز', centerX, centerY + 20);
    
    // رسم نقطة النهاية على شريط التقدم
    if (value > 0 && value < 100) {
      const endPointAngle = endAngle;
      const endPointX = centerX + Math.cos(endPointAngle) * radius;
      const endPointY = centerY + Math.sin(endPointAngle) * radius;
      
      // دائرة النهاية
      ctx.beginPath();
      ctx.arc(endPointX, endPointY, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(109, 40, 217, 0.6)';
      ctx.fill();
      
      // نقطة داخلية
      ctx.beginPath();
      ctx.arc(endPointX, endPointY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#6d28d9';
      ctx.shadowBlur = 0;
      ctx.fill();
    }
    
    // إضافة وميض على شريط التقدم
    const drawSparkle = () => {
      const sparkleAngle = startAngle + (2 * Math.PI * value / 100) * Math.random();
      const sparkleX = centerX + Math.cos(sparkleAngle) * radius;
      const sparkleY = centerY + Math.sin(sparkleAngle) * radius;
      
      ctx.beginPath();
      const grd = ctx.createRadialGradient(
        sparkleX, sparkleY, 0, 
        sparkleX, sparkleY, 6
      );
      grd.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = grd;
      ctx.arc(sparkleX, sparkleY, 6, 0, 2 * Math.PI);
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      ctx.shadowBlur = 0;
    };
    
    // إضافة وميض متعدد على امتداد شريط التقدم
    if (value > 0) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => drawSparkle(), i * 300);
      }
    }
  }, [value]);
  
  return (
    <div className="relative flex items-center justify-center mt-[-30px]">
      <canvas 
        ref={canvasRef} 
        width={180} 
        height={180}
        className="transition-all duration-1000 ease-out"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-xs text-gray-500 mt-14">التقدم العام</div>
      </div>
    </div>
  );
};

export default ProgressCircle; 