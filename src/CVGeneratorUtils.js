export function loadScript(src) {
  if (document.querySelector("script[data-src='" + src + "']")) return Promise.resolve();
  return new Promise(function(res, rej) {
    var s = document.createElement("script");
    s.src = src;
    s.setAttribute("data-src", src);
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

export function extractCVText(file) {
  var name = file.name.toLowerCase();
  var isPDF = file.type === "application/pdf" || name.slice(-4) === ".pdf";
  var isDOCX = name.slice(-5) === ".docx";

  if (isPDF) {
    var pdfSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    return loadScript(pdfSrc).then(function() {
      return new Promise(function(resolve, reject) {
        var reader = new FileReader();
        reader.onerror = reject;
        reader.onload = function(e) {
          var workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
          window.pdfjsLib.getDocument({ data: e.target.result }).promise.then(function(pdf) {
            var text = "";
            var total = pdf.numPages;
            var chain = Promise.resolve();
            for (var p = 1; p <= total; p++) {
              chain = chain.then(function(pageNum) {
                return function() {
                  return pdf.getPage(pageNum).then(function(page) {
                    return page.getTextContent().then(function(content) {
                      text += content.items.map(function(item) { return item.str; }).join(" ") + "\n";
                    });
                  });
                };
              }(p));
            }
            chain.then(function() { resolve(text); }).catch(reject);
          }).catch(reject);
        };
        reader.readAsArrayBuffer(file);
      });
    });
  }

  if (isDOCX) {
    var mammothSrc = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    return loadScript(mammothSrc).then(function() {
      return file.arrayBuffer().then(function(ab) {
        return window.mammoth.extractRawText({ arrayBuffer: ab }).then(function(r) {
          return r.value || "";
        });
      });
    });
  }

  return file.text();
}

export function downloadDOCX(cv, cl) {
  var docxSrc = "https://cdnjs.cloudflare.com/ajax/libs/docx/8.5.0/docx.umd.min.js";
  return loadScript(docxSrc).then(function() {
    var D = window.docx;
    var BLUE = "1A3FA8";
    var DARK = "1a1a2e";
    var GRAY = "6b7280";

    function hr() {
      return new D.Paragraph({
        border: { bottom: { style: D.BorderStyle.SINGLE, size: 4, color: BLUE } },
        spacing: { after: 120 }
      });
    }

    function heading(text) {
      return new D.Paragraph({
        children: [new D.TextRun({ text: text, bold: true, color: BLUE, size: 26, font: "Calibri" })],
        spacing: { before: 240, after: 60 }
      });
    }

    function para(text, opts) {
      return new D.Paragraph({
        children: [new D.TextRun(Object.assign({ text: text || "", size: 22, font: "Calibri", color: DARK }, opts || {}))],
        spacing: { after: 60 }
      });
    }

    function bullet(text) {
      return new D.Paragraph({
        children: [new D.TextRun({ text: "- " + text, size: 22, font: "Calibri", color: DARK })],
        indent: { left: 360 },
        spacing: { after: 40 }
      });
    }

    var contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
    var children = [];

    children.push(new D.Paragraph({
      children: [new D.TextRun({ text: cv.name || "", bold: true, size: 48, font: "Calibri", color: DARK })],
      alignment: D.AlignmentType.CENTER,
      spacing: { after: 80 }
    }));
    children.push(new D.Paragraph({
      children: [new D.TextRun({ text: contact, size: 20, font: "Calibri", color: GRAY })],
      alignment: D.AlignmentType.CENTER,
      spacing: { after: 200 }
    }));

    children.push(heading("PROFESSIONAL SUMMARY"));
    children.push(hr());
    children.push(para(cv.summary));

    if (cv.experience && cv.experience.length > 0) {
      children.push(heading("WORK EXPERIENCE"));
      children.push(hr());
      cv.experience.forEach(function(e) {
        children.push(new D.Paragraph({
          children: [new D.TextRun({ text: e.title + " | " + e.company, bold: true, size: 24, font: "Calibri", color: DARK })],
          spacing: { before: 160, after: 40 }
        }));
        children.push(new D.Paragraph({
          children: [new D.TextRun({ text: e.startDate + " - " + e.endDate, size: 20, font: "Calibri", color: GRAY, italics: true })],
          spacing: { after: 80 }
        }));
        (e.bullets || []).forEach(function(b) { children.push(bullet(b)); });
      });
    }

    if (cv.education && cv.education.length > 0) {
      children.push(heading("EDUCATION"));
      children.push(hr());
      cv.education.forEach(function(e) {
        children.push(para(e.degree + " | " + e.institution + " | " + e.year + (e.grade ? " | " + e.grade : "")));
      });
    }

    if (cv.skills && cv.skills.length > 0) {
      children.push(heading("SKILLS"));
      children.push(hr());
      children.push(para(cv.skills.join("  |  ")));
    }

    if (cv.certifications && cv.certifications.length > 0) {
      children.push(heading("CERTIFICATIONS"));
      children.push(hr());
      cv.certifications.forEach(function(c) { children.push(bullet(c)); });
    }

    children.push(new D.Paragraph({ pageBreakBefore: true }));
    children.push(new D.Paragraph({
      children: [new D.TextRun({ text: "COVER LETTER", bold: true, size: 36, font: "Calibri", color: BLUE })],
      alignment: D.AlignmentType.CENTER,
      spacing: { after: 80 }
    }));
    children.push(hr());
    children.push(para(cv.name, { bold: true }));
    children.push(para(contact));
    children.push(para(""));
    children.push(para("Dear Hiring Manager,"));
    children.push(para(""));
    children.push(para(cl.opening));
    children.push(para(""));
    children.push(para(cl.body1));
    children.push(para(""));
    children.push(para(cl.body2));
    children.push(para(""));
    children.push(para(cl.closing));
    children.push(para(""));
    children.push(para("Yours sincerely,"));
    children.push(para(""));
    children.push(para(cv.name, { bold: true }));

    var doc = new D.Document({
      sections: [{
        properties: { page: { margin: { top: 720, right: 900, bottom: 720, left: 900 } } },
        children: children
      }]
    });

    return D.Packer.toBlob(doc).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "CV_CoverLetter.docx";
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}

export function downloadPDF(cv, cl) {
  var pdfLibSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js";
  return loadScript(pdfLibSrc).then(function() {
    var PL = window.PDFLib;
    return PL.PDFDocument.create().then(function(pdfDoc) {
      return Promise.all([
        pdfDoc.embedFont(PL.StandardFonts.HelveticaBold),
        pdfDoc.embedFont(PL.StandardFonts.Helvetica)
      ]).then(function(fonts) {
        var boldFont = fonts[0];
        var normFont = fonts[1];
        var BLUE  = PL.rgb(0.10, 0.25, 0.66);
        var DARK  = PL.rgb(0.10, 0.10, 0.14);
        var GRAY  = PL.rgb(0.42, 0.44, 0.50);
        var GREEN = PL.rgb(0.09, 0.64, 0.29);
        var margin = 50;
        var pageW  = 595;
        var pageH  = 842;
        var colW   = pageW - margin * 2;
        var page   = pdfDoc.addPage([pageW, pageH]);
        var y      = pageH - margin;

        function newPage() {
          page = pdfDoc.addPage([pageW, pageH]);
          y = pageH - margin;
        }

        function chk(n) {
          if (y - n < margin) newPage();
        }

        function drawText(text, opts) {
          var font   = opts && opts.font   ? opts.font   : normFont;
          var size   = opts && opts.size   ? opts.size   : 10;
          var color  = opts && opts.color  ? opts.color  : DARK;
          var indent = opts && opts.indent ? opts.indent : 0;
          if (!text) return;
          var words = text.split(" ");
          var line  = "";
          var lines = [];
          words.forEach(function(w) {
            var test = line ? line + " " + w : w;
            if (font.widthOfTextAtSize(test, size) > colW - indent) {
              if (line) lines.push(line);
              line = w;
            } else {
              line = test;
            }
          });
          if (line) lines.push(line);
          lines.forEach(function(l) {
            chk(size + 4);
            page.drawText(l, { x: margin + indent, y: y, size: size, font: font, color: color });
            y -= size + 4;
          });
        }

        function drawHeading(text) {
          chk(30);
          y -= 8;
          drawText(text, { font: boldFont, size: 11, color: BLUE });
          chk(4);
          page.drawLine({
            start: { x: margin, y: y + 2 },
            end:   { x: pageW - margin, y: y + 2 },
            thickness: 0.8,
            color: BLUE
          });
          y -= 6;
        }

        var contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
        var nameW = boldFont.widthOfTextAtSize(cv.name || "", 20);
        var nameX = pageW * 0.5 - nameW * 0.5;
        page.drawText(cv.name || "", { x: nameX, y: y, size: 20, font: boldFont, color: DARK });
        y -= 26;

        var contW = normFont.widthOfTextAtSize(contact, 9);
        var contX = pageW * 0.5 - contW * 0.5;
        if (contX < margin) contX = margin;
        page.drawText(contact, { x: contX, y: y, size: 9, font: normFont, color: GRAY });
        y -= 18;

        if (cv.atsScore) {
          var scoreText = "ATS Score: " + cv.atsScore + "%";
          var scoreW = normFont.widthOfTextAtSize(scoreText, 8);
          var scoreX = pageW * 0.5 - scoreW * 0.5;
          if (scoreX < margin) scoreX = margin;
          page.drawText(scoreText, { x: scoreX, y: y, size: 8, font: normFont, color: GREEN });
          y -= 16;
        }
        y -= 4;

        drawHeading("PROFESSIONAL SUMMARY");
        drawText(cv.summary || "");
        y -= 4;

        if (cv.experience && cv.experience.length > 0) {
          drawHeading("WORK EXPERIENCE");
          cv.experience.forEach(function(e) {
            y -= 4;
            drawText(e.title + "  |  " + e.company, { font: boldFont, size: 10 });
            drawText(e.startDate + " - " + e.endDate, { size: 9, color: GRAY });
            (e.bullets || []).forEach(function(b) {
              drawText("- " + b, { size: 9, indent: 10 });
            });
          });
          y -= 4;
        }

        if (cv.education && cv.education.length > 0) {
          drawHeading("EDUCATION");
          cv.education.forEach(function(e) {
            drawText(e.degree + "  |  " + e.institution + "  |  " + e.year, { size: 10 });
          });
          y -= 4;
        }

        if (cv.skills && cv.skills.length > 0) {
          drawHeading("SKILLS");
          drawText(cv.skills.join("  |  "), { size: 9 });
          y -= 4;
        }

        newPage();
        var clTitle = "COVER LETTER";
        var clW = boldFont.widthOfTextAtSize(clTitle, 16);
        var clX = pageW * 0.5 - clW * 0.5;
        page.drawText(clTitle, { x: clX, y: y, size: 16, font: boldFont, color: BLUE });
        y -= 22;
        page.drawLine({
          start: { x: margin, y: y + 4 },
          end:   { x: pageW - margin, y: y + 4 },
          thickness: 0.8,
          color: BLUE
        });
        y -= 16;

        drawText(cv.name || "", { font: boldFont });
        drawText(contact, { color: GRAY, size: 9 });
        y -= 10;
        drawText("Dear Hiring Manager,");
        y -= 6;
        drawText(cl.opening || "");
        y -= 6;
        drawText(cl.body1 || "");
        y -= 6;
        drawText(cl.body2 || "");
        y -= 6;
        drawText(cl.closing || "");
        y -= 10;
        drawText("Yours sincerely,");
        y -= 14;
        drawText(cv.name || "", { font: boldFont });

        return pdfDoc.save().then(function(bytes) {
          var blob = new Blob([bytes], { type: "application/pdf" });
          var url  = URL.createObjectURL(blob);
          var a    = document.createElement("a");
          a.href     = url;
          a.download = "CV_CoverLetter.pdf";
          a.click();
          URL.revokeObjectURL(url);
        });
      });
    });
  });
}
