const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Generates an official Lagos State MIST SIWES Completion Certificate PDF.
 * 
 * @param {Object} internData
 * @param {string} internData.name - Intern full name
 * @param {string} internData.institution - Intern tertiary institution
 * @param {string} internData.matricNumber - Matriculation / student ID number
 * @param {string} internData.unit - Assigned MIST department / unit
 * @param {string} internData.siwesDuration - '3_months', '6_months', or '1_year'
 * @param {number} internData.siwesDurationWeeks - 12, 24, or 52
 * @param {Date|string} internData.siwesStartDate - Tenure start date
 * @param {Date|string} internData.siwesEndDate - Tenure end date
 * @param {string} [internData.serialNumber] - Optional verification serial
 * @returns {Promise<{ pdfBuffer: Buffer, serialNumber: string }>}
 */
function generateCompletionCertificate(internData) {
  return new Promise((resolve, reject) => {
    try {
      const serialNumber = internData.serialNumber || 
        `MIST-SIWES-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // A4 Landscape dimensions in points: 841.89 x 595.28
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 30,
        info: {
          Title: `SIWES Completion Certificate - ${internData.name}`,
          Author: 'Lagos State Ministry of Innovation, Science and Technology',
          Subject: 'Official SIWES Completion Certificate',
          Keywords: 'MIST, Lagos State, SIWES, Internship, Certificate'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve({ pdfBuffer, serialNumber });
      });
      doc.on('error', (err) => reject(err));

      const pageWidth = 841.89;
      const pageHeight = 595.28;

      // 1. Background Tint
      doc.rect(0, 0, pageWidth, pageHeight).fill('#FAFCFF');

      // 2. Decorative Double Border
      // Outer Navy Border
      doc.lineWidth(4);
      doc.rect(22, 22, pageWidth - 44, pageHeight - 44).stroke('#1A365D');

      // Inner Lagos Green Border
      doc.lineWidth(1.5);
      doc.rect(28, 28, pageWidth - 56, pageHeight - 56).stroke('#008751');

      // Corner Civic Accents
      const drawCornerAccent = (x, y, flipX = 1, flipY = 1) => {
        doc.save();
        doc.translate(x, y);
        doc.scale(flipX, flipY);
        doc.lineWidth(1);
        doc.strokeColor('#D97706');
        doc.moveTo(0, 0).lineTo(20, 0).stroke();
        doc.moveTo(0, 0).lineTo(0, 20).stroke();
        doc.rect(3, 3, 5, 5).fill('#008751');
        doc.restore();
      };

      drawCornerAccent(34, 34, 1, 1);
      drawCornerAccent(pageWidth - 34, 34, -1, 1);
      drawCornerAccent(34, pageHeight - 34, 1, -1);
      drawCornerAccent(pageWidth - 34, pageHeight - 34, -1, -1);

      // 3. Optional Logo or Civic Emblem
      const logoPng = path.join(__dirname, '../assets/MIST.png');
      if (fs.existsSync(logoPng)) {
        try {
          doc.image(logoPng, (pageWidth - 60) / 2, 42, { width: 60 });
        } catch (e) {
          // Fallback if image format fails
        }
      } else {
        // Draw crisp vector Civic Crest Badge
        const centerX = pageWidth / 2;
        const crestY = 52;
        doc.save();
        // Gold Outer Ring
        doc.circle(centerX, crestY + 12, 22).lineWidth(2).stroke('#D97706');
        // Navy Shield
        doc.circle(centerX, crestY + 12, 18).fill('#1A365D');
        // Green Core
        doc.circle(centerX, crestY + 12, 10).fill('#008751');
        // White star / letter M
        doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold')
          .text('M', centerX - 4, crestY + 7);
        doc.restore();
      }

      // 4. Header Titles
      const headerTop = 86;
      doc.font('Helvetica-Bold')
        .fontSize(13)
        .fillColor('#1A365D')
        .text('LAGOS STATE GOVERNMENT OF NIGERIA', 0, headerTop, {
          align: 'center',
          characterSpacing: 1.5
        });

      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#008751')
        .text('MINISTRY OF INNOVATION, SCIENCE AND TECHNOLOGY (MIST)', 0, headerTop + 18, {
          align: 'center',
          characterSpacing: 1
        });

      doc.font('Helvetica-Oblique')
        .fontSize(8)
        .fillColor('#64748B')
        .text('DIRECTORATE OF INFORMATION & COMMUNICATIONS TECHNOLOGY', 0, headerTop + 32, {
          align: 'center',
          characterSpacing: 0.8
        });

      // Divider Line
      doc.lineWidth(1)
        .strokeColor('#CBD5E1')
        .moveTo(140, headerTop + 48)
        .lineTo(pageWidth - 140, headerTop + 48)
        .stroke();

      // Small Diamond in Center
      doc.polygon([pageWidth / 2 - 4, headerTop + 48], [pageWidth / 2, headerTop + 44], [pageWidth / 2 + 4, headerTop + 48], [pageWidth / 2, headerTop + 52])
        .fill('#D97706');

      // 5. Main Certificate Title
      doc.font('Helvetica-Bold')
        .fontSize(22)
        .fillColor('#1A365D')
        .text('CERTIFICATE OF SIWES COMPLETION', 0, headerTop + 62, {
          align: 'center',
          characterSpacing: 2
        });

      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#64748B')
        .text('THIS IS TO OFFICIALLY CERTIFY THAT', 0, headerTop + 94, {
          align: 'center',
          characterSpacing: 2
        });

      // 6. Recipient Intern Name
      doc.font('Helvetica-Bold')
        .fontSize(26)
        .fillColor('#008751')
        .text(internData.name.toUpperCase(), 0, headerTop + 116, {
          align: 'center'
        });

      // Sub-line under name
      const nameWidth = Math.min(480, Math.max(300, internData.name.length * 15));
      doc.lineWidth(1)
        .strokeColor('#D97706')
        .moveTo((pageWidth - nameWidth) / 2, headerTop + 148)
        .lineTo((pageWidth + nameWidth) / 2, headerTop + 148)
        .stroke();

      // 7. Academic Affiliation
      const instText = internData.institution 
        ? `${internData.institution}` 
        : 'Tertiary Academic Institution';
      const matricText = internData.matricNumber 
        ? `Matriculation / Student ID: ${internData.matricNumber}` 
        : '';
      const academicLine = matricText ? `${instText}  •  ${matricText}` : instText;

      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#334155')
        .text(academicLine, 0, headerTop + 156, {
          align: 'center'
        });

      // 8. Body Citation
      const durationLabel = internData.siwesDuration === '3_months' 
        ? '3 Months (12 Weeks)' 
        : internData.siwesDuration === '1_year' 
          ? '1 Year (52 Weeks)' 
          : '6 Months (24 Weeks)';

      const formatD = (d) => {
        if (!d) return 'N/A';
        const dateObj = new Date(d);
        return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      };

      const dateRangeStr = `${formatD(internData.siwesStartDate)} to ${formatD(internData.siwesEndDate)}`;

      doc.font('Helvetica')
        .fontSize(10.5)
        .fillColor('#475569')
        .text(
          `has successfully satisfied all rigorous curriculum milestones, practical work assignments, and verified daily geofenced attendance compliance during the ${durationLabel} Students Industrial Work Experience Scheme (SIWES) attachment in the`,
          80,
          headerTop + 182,
          {
            align: 'center',
            width: pageWidth - 160,
            lineGap: 4
          }
        );

      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#1A365D')
        .text(`${internData.unit.toUpperCase()} UNIT`, 0, headerTop + 224, {
          align: 'center',
          characterSpacing: 1
        });

      doc.font('Helvetica')
        .fontSize(9.5)
        .fillColor('#64748B')
        .text(`Tenure Period: ${dateRangeStr}`, 0, headerTop + 244, {
          align: 'center'
        });

      // 9. Signatures and Verification Footer
      const footerY = 445;

      // Left Signature: Director / Coordinator
      doc.lineWidth(0.8).strokeColor('#94A3B8')
        .moveTo(110, footerY)
        .lineTo(270, footerY)
        .stroke();

      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#1A365D')
        .text('DIRECTOR, ICT & INNOVATION', 110, footerY + 6, { width: 160, align: 'center' });

      doc.font('Helvetica')
        .fontSize(7.5)
        .fillColor('#64748B')
        .text('MIST Secretariat, Alausa, Ikeja', 110, footerY + 18, { width: 160, align: 'center' });

      // Right Signature: Supervisor
      doc.lineWidth(0.8).strokeColor('#94A3B8')
        .moveTo(pageWidth - 270, footerY)
        .lineTo(pageWidth - 110, footerY)
        .stroke();

      doc.font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#1A365D')
        .text('SIWES DESK OFFICER', pageWidth - 270, footerY + 6, { width: 160, align: 'center' });

      doc.font('Helvetica')
        .fontSize(7.5)
        .fillColor('#64748B')
        .text('Directorate of Admin & HR', pageWidth - 270, footerY + 18, { width: 160, align: 'center' });

      // Center Official Embossed Seal
      const sealCenterX = pageWidth / 2;
      const sealCenterY = footerY - 10;
      doc.save();
      // Outer Seal Starburst/circle
      doc.circle(sealCenterX, sealCenterY, 32).lineWidth(2).stroke('#D97706');
      doc.circle(sealCenterX, sealCenterY, 28).lineWidth(1).stroke('#008751');
      doc.circle(sealCenterX, sealCenterY, 26).fill('#FFFFFF');
      doc.font('Helvetica-Bold').fontSize(6).fillColor('#1A365D')
        .text('OFFICIAL SEAL', sealCenterX - 22, sealCenterY - 10, { width: 44, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#008751')
        .text('LAGOS STATE', sealCenterX - 22, sealCenterY, { width: 44, align: 'center' });
      doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#D97706')
        .text('★ MIST ★', sealCenterX - 22, sealCenterY + 8, { width: 44, align: 'center' });
      doc.restore();

      // 10. Bottom Security / Serial Number Bar
      const bottomY = pageHeight - 54;
      doc.lineWidth(0.5).strokeColor('#E2E8F0')
        .moveTo(40, bottomY)
        .lineTo(pageWidth - 40, bottomY)
        .stroke();

      const issueDateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.font('Courier')
        .fontSize(7.5)
        .fillColor('#64748B')
        .text(`VERIFICATION SERIAL: ${serialNumber}`, 45, bottomY + 8);

      doc.font('Helvetica')
        .fontSize(7.5)
        .fillColor('#64748B')
        .text(`DATE OF ISSUANCE: ${issueDateStr}`, 0, bottomY + 8, { align: 'center' });

      doc.font('Courier')
        .fontSize(7.5)
        .fillColor('#008751')
        .text('STATUS: VERIFIED & CLEARED', pageWidth - 240, bottomY + 8, { width: 195, align: 'right' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateCompletionCertificate
};
