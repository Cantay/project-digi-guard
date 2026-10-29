import PDFKit
import AppKit
let args = CommandLine.arguments
let doc = PDFDocument(url: URL(fileURLWithPath: args[1]))!
let width = CGFloat(Double(args[3]) ?? 1600)
for i in 0..<doc.pageCount {
    let page = doc.page(at: i)!
    let box = page.bounds(for: .mediaBox)
    let scale = width / box.width
    let size = NSSize(width: box.width * scale, height: box.height * scale)
    let img = page.thumbnail(of: size, for: .mediaBox)
    let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
    let jpg = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.85])!
    try! jpg.write(to: URL(fileURLWithPath: String(format: "%@/p%02d.jpg", args[2], i + 1)))
    print(i + 1, Int(size.width), "x", Int(size.height))
}
