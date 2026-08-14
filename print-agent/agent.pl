#!/usr/bin/perl
# cucquy-print-agent (bản Perl) — cầu nối in local cho máy in nhiệt 58mm (ESC/POS).
#
# Vì sao Perl: macOS KHÔNG còn bundle python3 (chỉ là stub, cần Xcode CLT mới có thật),
# nhưng /usr/bin/perl thì LUÔN có sẵn trên mọi máy Mac → chạy được ngay, không cài gì.
#
# - Nghe http://127.0.0.1:9110 (chỉ localhost).
# - POST /print : body = bytes ESC/POS thô → `lp -d <queue> -o raw` (bỏ qua driver).
# - GET  /ping  : kiểm tra agent sống + tên máy in dò được.
# - TỰ DÒ queue Xprinter qua `lpstat -v` (khớp usb://...Xprinter) → không hardcode.
# - KHÔNG gọi lpinfo (enumerate USB làm máy Xprinter reset → offline). Việc khớp URI để cho
#   hook cắm-USB (fix-xprinter.sh) lo. Ở đây chỉ cupsenable/cupsaccept (nhẹ) rồi lp raw.
use strict;
use warnings;
use IO::Socket::INET;
$| = 1;

my $PORT = 9110;

# Trả tên CUPS queue trỏ tới máy Xprinter (hoặc undef).
sub find_printer {
    my $out = `/usr/bin/lpstat -v 2>/dev/null` || '';
    for my $line (split /\n/, $out) {
        if ($line =~ m{(\S+):\s*(usb://\S+)}) {
            my ($q, $uri) = ($1, $2);
            return $q if $uri =~ /Xprinter/i;
        }
    }
    return undef;
}

# Máy in Xprinter (idVendor 1155) có đang HIỆN DIỆN trên bus USB không?
# Máy hay tự ngắt-rồi-tự-về sau ~4-5s khi in mảng đen (nhiễu điện đầu in nhiệt).
sub printer_present {
    my $out = `/usr/sbin/ioreg -p IOUSB -l -w 0 2>/dev/null` || '';
    return $out =~ /"idVendor"\s*=\s*1155/ ? 1 : 0;
}

# Đợi máy in quay lại bus USB (tối đa ~$max giây) → không in vào lúc máy vừa rớt/đang vắng
# → in lại sau khi ra rác là ăn ngay, KHỎI phải rút–cắm hub bằng tay.
sub wait_present {
    my ($max) = @_;
    for (my $i = 0; $i < $max * 2; $i++) {
        return 1 if printer_present();
        select(undef, undef, undef, 0.5);
    }
    return printer_present();
}

# Đọc 1 dòng (tới \n) từ socket bằng read có đệm — dùng NHẤT QUÁN với đọc body bên dưới.
sub read_line {
    my ($c) = @_;
    my $line = '';
    while (1) {
        my $ch;
        my $n = read($c, $ch, 1);
        return undef if !defined($n) || $n == 0;
        last if $ch eq "\n";
        $line .= $ch unless $ch eq "\r";
    }
    return $line;
}

sub cors_headers {
    return "Access-Control-Allow-Origin: *\r\n"
         . "Access-Control-Allow-Methods: POST, GET, OPTIONS\r\n"
         . "Access-Control-Allow-Headers: Content-Type\r\n";
}

sub respond {
    my ($c, $code, $body) = @_;
    my %msg = (200 => 'OK', 400 => 'Bad Request', 404 => 'Not Found', 500 => 'Internal Server Error');
    my $status = $msg{$code} || 'OK';
    print $c "HTTP/1.1 $code $status\r\n";
    print $c cors_headers();
    print $c "Content-Type: text/plain; charset=utf-8\r\n";
    print $c "Content-Length: " . length($body) . "\r\n";
    print $c "Connection: close\r\n\r\n";
    print $c $body;
}

my $srv = IO::Socket::INET->new(
    LocalAddr => '127.0.0.1',
    LocalPort => $PORT,
    Proto     => 'tcp',
    Listen    => 16,
    ReuseAddr => 1,
) or die "cucquy-print-agent: khong bind duoc cong $PORT: $!\n";

print "cucquy-print-agent (perl) nghe tai http://127.0.0.1:$PORT\n";

while (my $c = $srv->accept) {
    eval {
        binmode($c);
        my $first = read_line($c);
        die "empty request\n" if !defined($first);
        my ($method, $path) = $first =~ /^(\S+)\s+(\S+)/ ? ($1, $2) : ('', '');
        my $len = 0;
        while (defined(my $h = read_line($c))) {
            last if $h eq '';
            $len = $1 if $h =~ /^content-length:\s*(\d+)/i;
        }

        if ($method eq 'OPTIONS') {
            print $c "HTTP/1.1 204 No Content\r\n" . cors_headers() . "\r\n";
        }
        elsif ($method eq 'GET') {
            my $p = find_printer();
            respond($c, 200, "cucquy-print-agent ok; printer=" . (defined $p ? $p : 'KHONG THAY'));
        }
        elsif ($method eq 'POST') {
            my $body = '';
            while (length($body) < $len) {
                my $chunk;
                my $n = read($c, $chunk, $len - length($body));
                last if !defined($n) || $n == 0;
                $body .= $chunk;
            }
            if (length($body) == 0) {
                respond($c, 400, "empty body");
            }
            else {
                my $q = find_printer();
                if (!defined $q) {
                    respond($c, 500, "khong tim thay may in Xprinter");
                }
                else {
                    # Đợi máy in quay lại bus USB (nó hay tự ngắt ~5s khi in mảng đen). In lại sau
                    # khi ra rác → agent tự đợi máy về rồi in → KHỎI rút–cắm hub bằng tay.
                    wait_present(10);
                    # Dọn job KẸT cũ trước khi in (job của lần in trước bị rớt USB → treo trong
                    # queue). Không dọn thì lần in mới xếp sau job chết → cũng không ra. In quán là
                    # thao tác tay từng tờ nên cancel hết là an toàn.
                    system('/usr/bin/cancel', '-a', $q);
                    # CHỈ bật lại queue (nhẹ) — KHÔNG lpinfo (reset máy). URI do hook cắm-USB khớp.
                    system('/usr/sbin/cupsenable', $q);
                    system('/usr/sbin/cupsaccept', $q);
                    my $pid = open(my $lp, '|-', '/usr/bin/lp', '-d', $q, '-o', 'raw');
                    if (!$pid) {
                        respond($c, 500, "khong mo duoc lp");
                    }
                    else {
                        binmode($lp);
                        print $lp $body;
                        my $ok = close($lp);
                        my $rc = $? >> 8;
                        if ($ok && $rc == 0) { respond($c, 200, "ok"); }
                        else { respond($c, 500, "lp loi (rc=$rc)"); }
                    }
                }
            }
        }
        else {
            respond($c, 404, "khong ho tro");
        }
    };
    # nuốt lỗi 1 kết nối, không để sập server
    close($c);
}
